"""
Listings CRUD, search, filter, and availability routes.
"""
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func

from app.database import get_db
from app.models import Listing, User, Booking, Wishlist, Category
from app.schemas import (
    ListingCreate, ListingUpdate, ListingResponse,
    ListingListResponse, HostInfo, CategoryResponse, AvailabilityResponse,
)
from app.auth import get_current_user, require_auth, require_host

router = APIRouter(prefix="/api", tags=["listings"])


def listing_to_response(listing: Listing, user_id: Optional[int] = None, db: Session = None) -> ListingResponse:
    """Convert a Listing model to ListingResponse with host info and wishlist status."""
    host_info = HostInfo.model_validate(listing.host) if listing.host else None
    
    is_wishlisted = False
    if user_id and db:
        wishlist = db.query(Wishlist).filter(
            Wishlist.user_id == user_id,
            Wishlist.listing_id == listing.id,
        ).first()
        is_wishlisted = wishlist is not None

    response = ListingResponse.model_validate(listing)
    response.host = host_info
    response.is_wishlisted = is_wishlisted
    return response


@router.get("/listings", response_model=ListingListResponse)
def get_listings(
    # Search
    location: Optional[str] = Query(None, description="City or country to search"),
    check_in: Optional[str] = Query(None, description="Check-in date YYYY-MM-DD"),
    check_out: Optional[str] = Query(None, description="Check-out date YYYY-MM-DD"),
    guests: Optional[int] = Query(None, ge=1, description="Number of guests"),
    # Filters
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    property_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    amenities: Optional[str] = Query(None, description="Comma-separated amenities"),
    bedrooms: Optional[int] = Query(None, ge=0),
    bathrooms: Optional[int] = Query(None, ge=0),
    # Pagination
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    # Sort
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    # Auth (optional)
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Search and filter listings with pagination.
    Public endpoint - no auth required.
    """
    query = db.query(Listing).options(joinedload(Listing.host)).filter(Listing.is_active == True)

    # Location search (city or country, case-insensitive)
    if location:
        location_lower = location.lower()
        query = query.filter(
            or_(
                func.lower(Listing.city).contains(location_lower),
                func.lower(Listing.country).contains(location_lower),
                func.lower(Listing.state).contains(location_lower),
                func.lower(Listing.address).contains(location_lower),
            )
        )

    # Date availability filter
    if check_in and check_out:
        # Exclude listings with overlapping confirmed bookings
        booked_listing_ids = db.query(Booking.listing_id).filter(
            Booking.status == "confirmed",
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        ).subquery()
        query = query.filter(~Listing.id.in_(booked_listing_ids))

    # Guest capacity
    if guests:
        query = query.filter(Listing.max_guests >= guests)

    # Price range
    if min_price is not None:
        query = query.filter(Listing.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price_per_night <= max_price)

    # Property type
    if property_type:
        query = query.filter(func.lower(Listing.property_type) == property_type.lower())

    # Category
    if category:
        query = query.filter(func.lower(Listing.category) == category.lower())

    # Amenities (all must be present)
    if amenities:
        amenity_list = [a.strip() for a in amenities.split(",")]
        for amenity in amenity_list:
            query = query.filter(Listing.amenities.contains(amenity))

    # Bedrooms / Bathrooms
    if bedrooms is not None:
        query = query.filter(Listing.bedrooms >= bedrooms)
    if bathrooms is not None:
        query = query.filter(Listing.bathrooms >= bathrooms)

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Listing.price_per_night.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Listing.price_per_night.desc())
    elif sort_by == "rating":
        query = query.order_by(Listing.rating_avg.desc())
    else:
        query = query.order_by(Listing.created_at.desc())

    # Count total
    total = query.count()

    # Paginate
    offset = (page - 1) * per_page
    listings = query.offset(offset).limit(per_page).all()

    user_id = user.id if user else None
    listing_responses = [listing_to_response(l, user_id, db) for l in listings]

    return ListingListResponse(
        listings=listing_responses,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page if total > 0 else 1,
    )


@router.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing(
    listing_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single listing by ID with full details."""
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.host))
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    user_id = user.id if user else None
    return listing_to_response(listing, user_id, db)


@router.post("/listings", response_model=ListingResponse, status_code=201)
def create_listing(
    data: ListingCreate,
    user: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    """Create a new listing. Requires host role."""
    listing = Listing(
        host_id=user.id,
        **data.model_dump(),
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    return listing_to_response(listing, user.id, db)


@router.put("/listings/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: int,
    data: ListingUpdate,
    user: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    """Update a listing. Only the owner can update."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this listing")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)

    db.commit()
    db.refresh(listing)
    return listing_to_response(listing, user.id, db)


@router.delete("/listings/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    user: User = Depends(require_host),
    db: Session = Depends(get_db),
):
    """Delete a listing. Only the owner can delete."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.host_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")

    db.delete(listing)
    db.commit()


@router.get("/listings/{listing_id}/availability", response_model=AvailabilityResponse)
def get_availability(
    listing_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get booked date ranges for a listing.

    Includes confirmed bookings plus other guests' still-active pending holds
    (created within the last 10 minutes), so the calendar matches what
    POST /api/bookings/hold will actually accept. The requesting user's own
    holds are excluded because that endpoint reuses them instead of rejecting.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)
    active_hold = and_(
        Booking.status == "pending",
        Booking.created_at >= ten_mins_ago,
    )
    if user:
        active_hold = and_(active_hold, Booking.guest_id != user.id)

    bookings = (
        db.query(Booking)
        .filter(
            Booking.listing_id == listing_id,
            or_(Booking.status == "confirmed", active_hold),
        )
        .all()
    )

    booked_ranges = [
        {"check_in": b.check_in, "check_out": b.check_out}
        for b in bookings
    ]

    return AvailabilityResponse(booked_ranges=booked_ranges)


@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Get all listing categories."""
    categories = db.query(Category).all()
    return [CategoryResponse.model_validate(c) for c in categories]
