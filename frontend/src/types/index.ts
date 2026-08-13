/**
 * TypeScript interfaces for the Airbnb clone.
 */

export interface User {
  id: number;
  google_id?: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  is_host: boolean;
  is_superhost: boolean;
  created_at: string;
}

export interface HostInfo {
  id: number;
  name: string;
  avatar_url?: string;
  is_superhost: boolean;
  created_at: string;
}

export interface Listing {
  id: number;
  host_id: number;
  title: string;
  description: string;
  property_type: string;
  category?: string;
  price_per_night: number;
  cleaning_fee: number;
  service_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  address?: string;
  city: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  images: string[];
  house_rules?: string;
  rating_avg: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
  host?: HostInfo;
  is_wishlisted: boolean;
  is_available?: boolean;
}

export interface ListingListResponse {
  listings: Listing[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Booking {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
  created_at: string;
  listing?: Listing;
  guest?: User;
}

export interface Review {
  id: number;
  listing_id: number;
  user_id: number;
  booking_id?: number;
  rating: number;
  comment: string;
  created_at: string;
  user?: User;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  description?: string;
}

export interface GeolocationData {
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

export interface SearchFilters {
  location?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  category?: string;
  amenities?: string;
  bedrooms?: number;
  bathrooms?: number;
  sort_by?: string;
  page?: number;
  per_page?: number;
}

export interface BookingCreate {
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
}

export interface ReviewCreate {
  listing_id: number;
  booking_id?: number;
  rating: number;
  comment: string;
}

export interface ListingCreate {
  title: string;
  description: string;
  property_type: string;
  category?: string;
  price_per_night: number;
  cleaning_fee?: number;
  service_fee?: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  address?: string;
  city: string;
  state?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  images: string[];
  house_rules?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
