"""
Wishlist management routes (favorites).
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Wishlist, Listing, User
from app.schemas import ListingResponse
from app.auth import require_auth
from app.routers.listings import listing_to_response

router = APIRouter(prefix="/api", tags=["wishlists"])


@router.get("/wishlists", response_model=List[ListingResponse])
def get_wishlists(
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Get all wishlisted listings for the current user."""
    wishlists = (
        db.query(Wishlist)
        .options(joinedload(Wishlist.listing).joinedload(Listing.host))
        .filter(Wishlist.user_id == user.id)
        .order_by(Wishlist.created_at.desc())
        .all()
    )

    return [listing_to_response(w.listing, user.id, db) for w in wishlists if w.listing]


@router.post("/wishlists/{listing_id}")
def toggle_wishlist(
    listing_id: int,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Toggle a listing in the user's wishlist. Add if not present, remove if present."""
    # Validate listing exists
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Check if already wishlisted
    existing = db.query(Wishlist).filter(
        Wishlist.user_id == user.id,
        Wishlist.listing_id == listing_id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"action": "removed", "listing_id": listing_id}
    else:
        wishlist = Wishlist(user_id=user.id, listing_id=listing_id)
        db.add(wishlist)
        db.commit()
        return {"action": "added", "listing_id": listing_id}
