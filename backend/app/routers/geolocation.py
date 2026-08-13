"""
IP-based geolocation route.
Detects user location from their IP address using ip-api.com.
"""
from fastapi import APIRouter, Request
import httpx

from app.schemas import GeolocationResponse

router = APIRouter(prefix="/api", tags=["geolocation"])


@router.get("/geolocation", response_model=GeolocationResponse)
async def get_user_location(request: Request):
    """
    Detect the user's approximate location from their IP address.
    Uses ip-api.com (free, no API key needed, 45 req/min limit).
    
    Falls back to a default location if detection fails.
    """
    # Get client IP (handle reverse proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "8.8.8.8"

    # Skip localhost / private IPs
    private_prefixes = ("127.", "10.", "172.", "192.168.", "::1", "0.0.0.0")
    if ip.startswith(private_prefixes):
        # Default to a popular location for development
        return GeolocationResponse(
            city="Mumbai",
            region="Maharashtra",
            country="India",
            lat=19.076,
            lon=72.8777,
        )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip}")
            data = resp.json()

        if data.get("status") == "success":
            return GeolocationResponse(
                city=data.get("city"),
                region=data.get("regionName"),
                country=data.get("country"),
                lat=data.get("lat"),
                lon=data.get("lon"),
            )
    except Exception:
        pass

    # Fallback
    return GeolocationResponse(
        city="Mumbai",
        region="Maharashtra",
        country="India",
        lat=19.076,
        lon=72.8777,
    )
