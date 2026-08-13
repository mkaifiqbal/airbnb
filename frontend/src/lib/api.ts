/**
 * API client for communicating with the FastAPI backend.
 */
import {
  Listing, ListingListResponse, ListingCreate,
  Booking, BookingCreate,
  Review, ReviewCreate,
  Category, User, AuthResponse, GeolocationData, SearchFilters,
} from '@/types';

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_BASE = rawApiBase.replace(/\/+$/, '');

/**
 * Get the stored auth token.
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('airbnb_token');
}

/**
 * Get stored user.
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('airbnb_user');
  return data ? JSON.parse(data) : null;
}

/**
 * Store auth data.
 */
export function setAuth(user: User, token: string) {
  localStorage.setItem('airbnb_token', token);
  localStorage.setItem('airbnb_user', JSON.stringify(user));
}

/**
 * Clear auth data.
 */
export function clearAuth() {
  localStorage.removeItem('airbnb_token');
  localStorage.removeItem('airbnb_user');
}

/**
 * Base fetch wrapper with auth headers.
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ─── Auth API ───

export async function emailAuth(data: {
  email: string;
  name?: string;
  avatar_url?: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/email', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function googleAuth(data: {
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/api/users/me');
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  return apiFetch<User>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function switchRole(): Promise<User> {
  return apiFetch<User>('/api/users/switch-role', {
    method: 'POST',
  });
}

// ─── Listings API ───

export async function getListings(filters: SearchFilters = {}): Promise<ListingListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  return apiFetch<ListingListResponse>(`/api/listings?${params.toString()}`);
}

export async function getListing(id: number): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${id}`);
}

export async function createListing(data: ListingCreate): Promise<Listing> {
  return apiFetch<Listing>('/api/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateListing(id: number, data: Partial<ListingCreate>): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteListing(id: number): Promise<void> {
  return apiFetch<void>(`/api/listings/${id}`, {
    method: 'DELETE',
  });
}

export async function getAvailability(id: number): Promise<{ booked_ranges: Array<{ check_in: string; check_out: string }> }> {
  return apiFetch(`/api/listings/${id}/availability`);
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories');
}

// ─── Bookings API ───

export async function holdBooking(data: BookingCreate): Promise<Booking> {
  return apiFetch<Booking>('/api/bookings/hold', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function confirmBooking(bookingId: number): Promise<Booking> {
  return apiFetch<Booking>(`/api/bookings/${bookingId}/confirm`, {
    method: 'POST',
  });
}

export async function getMyTrips(): Promise<Booking[]> {
  return apiFetch<Booking[]>('/api/bookings/trips');
}

export async function getHostBookings(): Promise<Booking[]> {
  return apiFetch<Booking[]>('/api/bookings/host');
}

export async function cancelBooking(id: number): Promise<Booking> {
  return apiFetch<Booking>(`/api/bookings/${id}/cancel`, {
    method: 'PUT',
  });
}

// ─── Reviews API ───

export async function createReview(data: ReviewCreate): Promise<Review> {
  return apiFetch<Review>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getListingReviews(listingId: number, page = 1): Promise<Review[]> {
  return apiFetch<Review[]>(`/api/listings/${listingId}/reviews?page=${page}`);
}

// ─── Wishlists API ───

export async function getWishlists(): Promise<Listing[]> {
  return apiFetch<Listing[]>('/api/wishlists');
}

export async function toggleWishlist(listingId: number): Promise<{ action: string; listing_id: number }> {
  return apiFetch(`/api/wishlists/${listingId}`, {
    method: 'POST',
  });
}

// ─── Upload API ───

export async function uploadImage(file: File): Promise<{ url: string; public_id: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

export async function uploadMultipleImages(files: File[]): Promise<{ images: Array<{ url: string; public_id: string }> }> {
  const token = getToken();
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await fetch(`${API_BASE}/api/upload/multiple`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

// ─── Geolocation API ───

export async function getUserLocation(): Promise<GeolocationData> {
  return apiFetch<GeolocationData>('/api/geolocation');
}
