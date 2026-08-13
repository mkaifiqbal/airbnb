/**
 * OpenStreetMap (Nominatim) geocoding helpers.
 *
 * Used by the host listing flow so every listing is saved with an exact map pin
 * and with city/state/country that match that pin.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export interface PlaceSuggestion {
  id: string;
  /** Full human readable place name, e.g. "LPU, Phagwara, Punjab, India". */
  label: string;
  latitude: number;
  longitude: number;
  /** Street level part of the address (house number + road / named place). */
  address: string;
  city: string;
  state: string;
  country: string;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  region?: string;
  country?: string;
}

interface NominatimPlace {
  place_id?: number | string;
  osm_id?: number | string;
  lat: string;
  lon: string;
  display_name?: string;
  name?: string;
  address?: NominatimAddress;
}

function pickCity(address: NominatimAddress): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state_district ||
    ''
  );
}

function pickStreet(place: NominatimPlace, address: NominatimAddress): string {
  const street = [address.house_number, address.road].filter(Boolean).join(' ');
  if (street) return street;
  if (place.name && place.name !== pickCity(address)) return place.name;
  return address.neighbourhood || address.suburb || '';
}

function toPlace(place: NominatimPlace): PlaceSuggestion {
  const address = place.address || {};
  return {
    id: String(place.place_id ?? place.osm_id ?? `${place.lat},${place.lon}`),
    label: place.display_name || place.name || `${place.lat}, ${place.lon}`,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    address: pickStreet(place, address),
    city: pickCity(address),
    state: address.state || address.region || '',
    country: address.country || '',
  };
}

/**
 * Search places by free text. Returns an empty list for blank/short queries.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    q: trimmed,
  });

  const response = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    headers: { 'Accept-Language': 'en' },
    signal,
  });
  if (!response.ok) throw new Error('Location lookup failed');

  const results: NominatimPlace[] = await response.json();
  return results.map(toPlace).filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
}

/**
 * Resolve an address for a pin dropped on the map.
 * Returns null when the coordinates cannot be resolved (e.g. open sea).
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<PlaceSuggestion | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '18',
    lat: String(latitude),
    lon: String(longitude),
  });

  const response = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, {
    headers: { 'Accept-Language': 'en' },
    signal,
  });
  if (!response.ok) throw new Error('Reverse lookup failed');

  const result: NominatimPlace & { error?: string } = await response.json();
  if (!result || result.error || !result.lat || !result.lon) return null;
  return toPlace(result);
}

/** Round to 6 decimals (~11 cm) so stored pins stay stable. */
export function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}
