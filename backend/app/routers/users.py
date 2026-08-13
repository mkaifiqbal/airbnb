"""
User authentication and profile management routes.
Handles Google OAuth login, profile updates, and role switching.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    GoogleAuthRequest, EmailAuthRequest, AuthResponse, UserResponse, UserUpdate,
)
from app.auth import create_jwt_token, require_auth

router = APIRouter(prefix="/api", tags=["users"])


@router.post("/auth/email", response_model=AuthResponse)
def email_auth(data: EmailAuthRequest, db: Session = Depends(get_db)):
    """
    Passwordless Email login/register.
    - If user exists by email, return user and JWT.
    - If new user, create account in database and return JWT.
    No verification/OTP required for quick seamless access.
    """
    clean_email = data.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address")

    user = db.query(User).filter(User.email == clean_email).first()

    if user:
        if data.name and not user.name:
            user.name = data.name.strip()
        if data.avatar_url and not user.avatar_url:
            user.avatar_url = data.avatar_url
        db.commit()
        db.refresh(user)
    else:
        if data.name and data.name.strip():
            display_name = data.name.strip()
        else:
            username_part = clean_email.split("@")[0].replace(".", " ").replace("_", " ").title()
            display_name = username_part if username_part else "Airbnb Guest"

        avatar = data.avatar_url or f"https://ui-avatars.com/api/?name={display_name.replace(' ', '+')}&background=FF385C&color=fff&size=150"

        user = User(
            google_id=None,
            email=clean_email,
            name=display_name,
            avatar_url=avatar,
            is_host=False,
            is_superhost=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_jwt_token(user.id, user.email)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=token,
    )


@router.post("/auth/google", response_model=AuthResponse)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Google OAuth login/register.
    - If user exists (by google_id or email), update and return JWT.
    - If new user, create account and return JWT.
    """
    # Check if user already exists
    user = db.query(User).filter(
        (User.google_id == data.google_id) | (User.email == data.email)
    ).first()

    if user:
        # Update existing user's Google info
        user.google_id = data.google_id
        user.name = data.name
        if data.avatar_url:
            user.avatar_url = data.avatar_url
        db.commit()
        db.refresh(user)
    else:
        # Create new user
        user = User(
            google_id=data.google_id,
            email=data.email,
            name=data.name,
            avatar_url=data.avatar_url,
            is_host=False,
            is_superhost=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_jwt_token(user.id, user.email)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        token=token,
    )


@router.get("/users/me", response_model=UserResponse)
def get_current_profile(user: User = Depends(require_auth)):
    """Get the current authenticated user's profile."""
    return UserResponse.model_validate(user)


@router.put("/users/me", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/users/switch-role", response_model=UserResponse)
def switch_role(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    """Toggle between guest and host mode."""
    user.is_host = not user.is_host
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)
