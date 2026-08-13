"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ──────────────── User Schemas ────────────────

class GoogleAuthRequest(BaseModel):
    google_id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    access_token: Optional[str] = None

class EmailAuthRequest(BaseModel):
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    google_id: Optional[str] = None
    email: str
    name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    is_host: bool = False
    is_superhost: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class AuthResponse(BaseModel):
    user: UserResponse
    token: str


# ──────────────── Listing Schemas ────────────────

class ListingCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    property_type: str
    category: Optional[str] = None
    price_per_night: float = Field(..., gt=0)
    cleaning_fee: float = Field(default=0, ge=0)
    service_fee: float = Field(default=0, ge=0)
    max_guests: int = Field(default=1, ge=1)
    bedrooms: int = Field(default=1, ge=0)
    beds: int = Field(default=1, ge=1)
    bathrooms: float = Field(default=1, ge=0.5)
    address: Optional[str] = None
    city: str
    state: Optional[str] = None
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenities: List[str] = []
    images: List[str] = []
    house_rules: Optional[str] = None

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    category: Optional[str] = None
    price_per_night: Optional[float] = None
    cleaning_fee: Optional[float] = None
    service_fee: Optional[float] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    house_rules: Optional[str] = None
    is_active: Optional[bool] = None

class HostInfo(BaseModel):
    id: int
    name: str
    avatar_url: Optional[str] = None
    is_superhost: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class ListingResponse(BaseModel):
    id: int
    host_id: int
    title: str
    description: str
    property_type: str
    category: Optional[str] = None
    price_per_night: float
    cleaning_fee: float
    service_fee: float
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    address: Optional[str] = None
    city: str
    state: Optional[str] = None
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenities: List[str] = []
    images: List[str] = []
    house_rules: Optional[str] = None
    rating_avg: float = 0
    review_count: int = 0
    is_active: bool = True
    created_at: datetime
    host: Optional[HostInfo] = None
    is_wishlisted: bool = False
    is_available: bool = True

    class Config:
        from_attributes = True

class ListingListResponse(BaseModel):
    listings: List[ListingResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


# ──────────────── Booking Schemas ────────────────

class BookingCreate(BaseModel):
    listing_id: int
    check_in: str  # "YYYY-MM-DD"
    check_out: str  # "YYYY-MM-DD"
    guests: int = Field(..., ge=1)

class BookingResponse(BaseModel):
    id: int
    listing_id: int
    guest_id: int
    check_in: str
    check_out: str
    guests: int
    total_price: float
    status: str
    created_at: datetime
    listing: Optional[ListingResponse] = None
    guest: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class AvailabilityResponse(BaseModel):
    booked_ranges: List[dict]  # [{"check_in": "...", "check_out": "..."}]


# ──────────────── Review Schemas ────────────────

class ReviewCreate(BaseModel):
    listing_id: int
    booking_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=5)

class ReviewResponse(BaseModel):
    id: int
    listing_id: int
    user_id: int
    booking_id: Optional[int] = None
    rating: int
    comment: str
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ──────────────── Category Schemas ────────────────

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ──────────────── Geolocation Schemas ────────────────

class GeolocationResponse(BaseModel):
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


# ──────────────── Upload Schemas ────────────────

class UploadResponse(BaseModel):
    url: str
    public_id: str

class MultiUploadResponse(BaseModel):
    images: List[UploadResponse]
