"""
FastAPI application entry point.
Configures CORS, mounts routers, and auto-seeds the database on startup.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal, Base, get_db
from app.models import User, Listing, Booking, Review, Wishlist, Category
from app.seed import seed_database, reset_database
from app.routers import users, listings, bookings, reviews, wishlists, upload, geolocation


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed database on startup."""
    print("[INIT] Creating database tables if needed...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("[INIT] Ensuring demo seed data is populated...")
        seed_database(db)
    except Exception as e:
        print(f"[INIT] Seeder exception (non-fatal): {e}")
    finally:
        db.close()
    yield


app = FastAPI(
    title="Airbnb Clone API",
    description="Backend API for the Airbnb clone application (FastAPI + PostgreSQL/SQLite)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration — supports localhost, Vercel deployments, Render previews, and custom domains
cors_env = os.getenv("CORS_ORIGINS", "*")
origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins else origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?|https://.*\.vercel\.app|https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(users.router)
app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(reviews.router)
app.include_router(wishlists.router)
app.include_router(upload.router)
app.include_router(geolocation.router)


@app.get("/")
def root():
    return {
        "message": "Airbnb Clone API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "airbnb-backend"}


@app.post("/api/seed/reset")
def api_reset_seed(db: Session = Depends(get_db)):
    """
    On-demand endpoint to reset all database records and re-seed clean demo data.
    Useful for Render restarts or whenever a fresh demo state is needed.
    """
    try:
        reset_database(db)
        return {
            "status": "success",
            "message": "Database reset and seeded successfully with demo data",
            "users": db.query(User).count(),
            "listings": db.query(Listing).count(),
            "categories": db.query(Category).count(),
            "bookings": db.query(Booking).count(),
            "reviews": db.query(Review).count(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seed reset failed: {str(e)}")


@app.post("/api/seed")
def api_seed_if_empty(db: Session = Depends(get_db)):
    """Seed the database if it contains no listings."""
    try:
        seed_database(db)
        return {
            "status": "success",
            "message": "Database seed check completed",
            "users": db.query(User).count(),
            "listings": db.query(Listing).count(),
            "categories": db.query(Category).count(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")
