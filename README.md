# 🏠 Airbnb Clone — Full-Stack Production Application

An Airbnb-inspired full-stack web application built with **Next.js 16 (React 19, TypeScript, Tailwind CSS)**, **FastAPI (Python 3.10+)**, and **SQLAlchemy ORM**. Features Google OAuth authentication, Cloudinary image hosting with automatic Pillow compression, interactive OpenStreetMap/Leaflet integration, 10-minute temporary reservation holds, host dashboard with a 7-step listing wizard, and dynamic split-screen search.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.0-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![Tailwind CSS v3](https://img.shields.io/badge/Tailwind_CSS-3.4.19-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?logo=python)](https://www.python.org/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448C5?logo=cloudinary)](https://cloudinary.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet)](https://leafletjs.com/)

> 📘 **Looking for deep architectural details?** See [DOCUMENTATION.md](file:///c:/Users/M%20Kaif/Desktop/ScalerAiAirBNB/DOCUMENTATION.md) for full database schemas, endpoint payloads, module breakdowns, and system diagrams.  
> 🚀 **Deploying to Vercel & Render?** Follow the step-by-step [DEPLOYMENT.md](file:///c:/Users/M%20Kaif/Desktop/ScalerAiAirBNB/DEPLOYMENT.md) guide with auto-seeded demo data on Render restarts.

---

## 🚀 Key Features

### 🔍 Discovery, Search & Map
- **Dynamic Split-Screen Map**: Browsing displays a 4-column responsive grid; searching switches to a split view with an interactive Leaflet map and dynamic price pill markers.
- **Smart Filters**: Multi-faceted filter modal (price range, property type, amenities, bedroom/bathroom counts).
- **Category Filter Bar**: Horizontal scrollable categories (*Beachfront*, *Cabins*, *Mansions*, *Amazing Pools*, *Trending*, etc.).
- **One-Click Logo Reset**: Clicking the Airbnb logo resets all active searches, filters, categories, and pagination back to default.
- **IP-Based Geolocation**: Automatic approximate location detection via `ip-api.com`.

### 🏡 Listings & Media Lightbox
- **Photo Mosaic & Lightbox**: 5-photo preview grid and dark-mode fullscreen lightbox modal.
- **Amenities Showcase**: Icon-mapped amenities (WiFi, Pool, AC, Hot Tub, BBQ Grill, etc.).
- **Live Price Calculation**: Nightly calculation with breakdown of cleaning and service fees.
- **Wishlist Toggle**: Heart button with micro-animation and instant saved collections.

### ⏱️ Booking Engine & 10-Minute Hold
- **10-Minute Temporary Hold**: Holding dates via `/api/bookings/hold` creates a 10-minute temporary reservation with live timer countdown.
- **Overlap Shielding**: Strict database-level checks ensure no double bookings or competing holds.
- **Trip Management**: Dedicated user portal for Upcoming and Past stays, cancellation, and verified guest reviews.

### 🔐 Seamless Authentication & Demo Access
- **Passwordless Email Login / Sign-Up**: Enter any email address to instantly log in or register with zero verification or OTP required — user is immediately saved in the database.
- **1-Click Demo Profiles**: Quick login buttons for **Demo Guest (Mike Chen)** to browse/book and **Demo Host (Sarah Johnson)** to manage properties and view earnings.
- **Google OAuth**: One-click Google sign-in integration with automatic profile photo retrieval.

### 💼 Host Portal & 7-Step Listing Builder
- **Host Analytics**: Real-time revenue metrics, active listings counter, and booking stats.
- **7-Step Creation Wizard**: Guided listing builder with category selection, room counters, amenities checklist, and pricing.
- **Cloudinary Image Optimization**: Pillow LANCZOS resampling and quality compression prior to cloud upload.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Capabilities |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router) | React 19, Server Components, TypeScript, Fast Refresh |
| **Styling & UI** | Tailwind CSS v3 | Custom Airbnb design system, HSL color tokens, micro-animations |
| **Mapping Engine** | Leaflet & OpenStreetMap | Custom HTML price markers, interactive popups, dynamic bounds |
| **Backend Framework** | FastAPI (Python 3.10+) | Async ASGI, Pydantic v2 schemas, automated OpenAPI `/docs` |
| **Database & ORM** | SQLAlchemy 2.0 (SQLite / PostgreSQL) | Cascading relations, indexing, constraints |
| **Auth & Security** | Python-Jose & Passlib | JWT stateless tokens (72h expiry), Bearer HTTP security |
| **Media Pipeline** | Cloudinary & Pillow | Anti-aliased resizing, JPEG/WEBP compression, CDN hosting |

---

## 📂 Project Architecture

```
ScalerAiAirBNB/
├── backend/                              # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py                       # App entry, CORS, lifespan startup & seeder
│   │   ├── database.py                   # SQLAlchemy engine & session factory
│   │   ├── models.py                     # ORM models (User, Listing, Booking, Review, Wishlist, Category)
│   │   ├── schemas.py                    # Pydantic v2 request/response schemas
│   │   ├── auth.py                       # JWT token management & auth dependencies
│   │   ├── cloudinary_utils.py           # Pillow image compression & Cloudinary upload
│   │   ├── seed.py                       # Sample database seeder
│   │   └── routers/                      # Route handlers (users, listings, bookings, reviews, wishlists, upload, geolocation)
│   ├── requirements.txt                  # Python dependencies
│   └── .env.example                      # Backend env template
│
├── frontend/                             # Next.js 16 TypeScript Frontend
│   ├── src/
│   │   ├── app/                          # App Router pages (/, /listings/[id], /book/[id], /host, /trips, /wishlists)
│   │   ├── components/                   # UI component library (navbar, search, listings, map, ui)
│   │   ├── hooks/useAuth.tsx             # Auth provider and state hook
│   │   ├── lib/api.ts                    # Typed API client with auth headers
│   │   └── types/index.ts                # Shared TypeScript definitions
│   ├── tailwind.config.js                # Custom Tailwind design tokens
│   └── package.json                      # Node dependencies & scripts
│
├── DOCUMENTATION.md                      # Comprehensive Architectural Manual
└── README.md                             # Production & Development Guide
```

---

## ⚡ Getting Started (Local Development)

### Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **Python**: v3.10+
- **npm** or **yarn** / **pnpm**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Start the FastAPI development server
uvicorn app.main:app --reload --port 8000
```

- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev
```

- **Frontend App**: `http://localhost:3000`

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
# Application
PROJECT_NAME="Airbnb Clone API"
ENVIRONMENT="development"
PORT=8000

# Security
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_HOURS=72

# Database
DATABASE_URL="sqlite:///./airbnb.db"
# For production PostgreSQL:
# DATABASE_URL="postgresql://username:password@localhost:5432/airbnb_db"

# Cloudinary (Optional for custom uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
```

---

## 🚢 Production Deployment

### 1. Backend (Gunicorn + Uvicorn Workers)
```bash
cd backend
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 2. Frontend (Next.js Production Build)
```bash
cd frontend
npm run build
npm run start -p 3000
```

### 3. Nginx Reverse Proxy (Example)
```nginx
# Frontend
server {
    server_name yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend API
server {
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🧪 Testing & Verification

- **API Documentation**: Open `http://localhost:8000/docs` to test all CRUD, search, booking, and review endpoints interactively.
- **Frontend Verification**: Run `npm run build` in the `frontend` folder to ensure all TypeScript types, route segments, and Tailwind styles compile cleanly.

---

## 📄 License & Attribution

Built for learning and portfolio demonstration purposes, honoring the design excellence and usability patterns of Airbnb.
