"""
Booking management routes.
Handles booking creation with overlap validation, trips, and cancellation.
"""
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_

from app.database import get_db
from app.models import Booking, Listing, User
from app.schemas import BookingCreate, BookingResponse
from app.auth import require_auth

router = APIRouter(prefix="/api", tags=["bookings"])


def booking_to_response(booking: Booking) -> BookingResponse:
    """Convert a Booking model to BookingResponse."""
    from app.routers.listings import listing_to_response
    
    response = BookingResponse.model_validate(booking)
    if booking.listing:
        response.listing = listing_to_response(booking.listing)
    if booking.guest:
        from app.schemas import UserResponse
        response.guest = UserResponse.model_validate(booking.guest)
    return response


@router.post("/bookings/hold", response_model=BookingResponse, status_code=201)
def hold_booking(
    data: BookingCreate,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Hold a booking for 10 minutes. Creates a 'pending' booking.
    """
    listing = db.query(Listing).filter(Listing.id == data.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not listing.is_active:
        raise HTTPException(status_code=400, detail="Listing is not available")
    if listing.host_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot book your own listing")

    try:
        check_in_date = datetime.strptime(data.check_in, "%Y-%m-%d").date()
        check_out_date = datetime.strptime(data.check_out, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if check_in_date >= check_out_date:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    if check_in_date < date.today():
        raise HTTPException(status_code=400, detail="Cannot book dates in the past")
    if data.guests > listing.max_guests:
        raise HTTPException(status_code=400, detail=f"Guest count exceeds maximum ({listing.max_guests})")

    ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)

    # If this guest already holds these exact dates, reuse that hold instead of
    # failing. Otherwise pressing "Reserve" twice would block the user for 10 mins.
    existing_hold = db.query(Booking).filter(
        Booking.listing_id == data.listing_id,
        Booking.guest_id == user.id,
        Booking.check_in == data.check_in,
        Booking.check_out == data.check_out,
        Booking.status == "pending",
        Booking.created_at >= ten_mins_ago,
    ).first()

    if existing_hold:
        if existing_hold.guests != data.guests:
            existing_hold.guests = data.guests
            num_nights = (check_out_date - check_in_date).days
            existing_hold.total_price = round(
                (listing.price_per_night * num_nights) + listing.cleaning_fee + listing.service_fee, 2
            )
            db.commit()
        return booking_to_response(db.query(Booking).options(joinedload(Booking.listing).joinedload(Listing.host), joinedload(Booking.guest)).filter(Booking.id == existing_hold.id).first())

    # Check for overlapping bookings (confirmed OR another guest's fresh pending hold)
    overlapping = db.query(Booking).filter(
        Booking.listing_id == data.listing_id,
        Booking.check_in < data.check_out,
        Booking.check_out > data.check_in,
        or_(
            Booking.status == "confirmed",
            and_(
                Booking.status == "pending",
                Booking.created_at >= ten_mins_ago,
                Booking.guest_id != user.id,
            ),
        )
    ).first()

    if overlapping:
        raise HTTPException(status_code=409, detail="Selected dates are not available. There is an overlapping booking.")

    # Release this guest's other stale/overlapping holds on the same listing so
    # they can freely change their mind about dates.
    db.query(Booking).filter(
        Booking.listing_id == data.listing_id,
        Booking.guest_id == user.id,
        Booking.status == "pending",
        Booking.check_in < data.check_out,
        Booking.check_out > data.check_in,
    ).update({"status": "expired"}, synchronize_session=False)
    db.commit()

    num_nights = (check_out_date - check_in_date).days
    total_price = (listing.price_per_night * num_nights) + listing.cleaning_fee + listing.service_fee

    booking = Booking(
        listing_id=data.listing_id,
        guest_id=user.id,
        check_in=data.check_in,
        check_out=data.check_out,
        guests=data.guests,
        total_price=round(total_price, 2),
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking_to_response(db.query(Booking).options(joinedload(Booking.listing).joinedload(Listing.host), joinedload(Booking.guest)).filter(Booking.id == booking.id).first())

@router.post("/bookings/{booking_id}/confirm", response_model=BookingResponse)
def confirm_booking(
    booking_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Confirm a pending booking if within 10 minutes.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.guest_id == user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status == "confirmed":
        return booking_to_response(db.query(Booking).options(joinedload(Booking.listing).joinedload(Listing.host), joinedload(Booking.guest)).filter(Booking.id == booking.id).first())
        
    if booking.status != "pending":
        raise HTTPException(status_code=400, detail="Booking cannot be confirmed")
        
    if booking.created_at < datetime.utcnow() - timedelta(minutes=10):
        booking.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Booking hold expired. Please try booking again.")
        
    booking.status = "confirmed"
    db.commit()
    db.refresh(booking)
    
    return booking_to_response(db.query(Booking).options(joinedload(Booking.listing).joinedload(Listing.host), joinedload(Booking.guest)).filter(Booking.id == booking.id).first())

@router.get("/bookings/trips")
def get_my_trips(
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Get all bookings for the current user (as guest)."""
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.listing).joinedload(Listing.host))
        .filter(Booking.guest_id == user.id)
        .order_by(Booking.check_in.desc())
        .all()
    )

    return [booking_to_response(b) for b in bookings]


@router.get("/bookings/host")
def get_host_bookings(
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Get all bookings for the host's listings."""
    bookings = (
        db.query(Booking)
        .join(Listing)
        .options(
            joinedload(Booking.listing).joinedload(Listing.host),
            joinedload(Booking.guest),
        )
        .filter(Listing.host_id == user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    return [booking_to_response(b) for b in bookings]


@router.put("/bookings/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Cancel a booking. Only the guest or the listing host can cancel."""
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.listing).joinedload(Listing.host), joinedload(Booking.guest))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Only guest or host can cancel
    if booking.guest_id != user.id and booking.listing.host_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)

    return booking_to_response(booking)
