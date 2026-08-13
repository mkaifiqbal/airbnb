"""
Review management routes.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models import Review, Listing, User, Booking
from app.schemas import ReviewCreate, ReviewResponse, UserResponse
from app.auth import require_auth

router = APIRouter(prefix="/api", tags=["reviews"])


@router.post("/reviews", response_model=ReviewResponse, status_code=201)
def create_review(
    data: ReviewCreate,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Create a review for a listing.
    Optionally tied to a completed booking.
    """
    # Validate listing exists
    listing = db.query(Listing).filter(Listing.id == data.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Cannot review own listing
    if listing.host_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot review your own listing")

    # If booking_id is provided, validate it
    if data.booking_id:
        booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.guest_id != user.id:
            raise HTTPException(status_code=403, detail="Not your booking")
        # Check if already reviewed this booking
        existing = db.query(Review).filter(Review.booking_id == data.booking_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Already reviewed this booking")

    # Create review
    review = Review(
        listing_id=data.listing_id,
        user_id=user.id,
        booking_id=data.booking_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()

    # Recalculate listing rating
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.listing_id == data.listing_id
    ).scalar()
    review_count = db.query(Review).filter(
        Review.listing_id == data.listing_id
    ).count()

    listing.rating_avg = round(float(avg_rating or 0), 2)
    listing.review_count = review_count
    db.commit()
    db.refresh(review)

    # Build response
    resp = ReviewResponse.model_validate(review)
    resp.user = UserResponse.model_validate(user)
    return resp


@router.get("/listings/{listing_id}/reviews", response_model=List[ReviewResponse])
def get_listing_reviews(
    listing_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Get all reviews for a listing, paginated."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    result = []
    for review in reviews:
        resp = ReviewResponse.model_validate(review)
        if review.user:
            resp.user = UserResponse.model_validate(review.user)
        result.append(resp)

    return result
