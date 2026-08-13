'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Listing } from '@/types';
import Link from 'next/link';

// Fix Leaflet's default icon issue with Webpack
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

interface MapProps {
  listings: Listing[];
  listingQuery?: string;
}

function MapUpdater({ listings }: { listings: Listing[] }) {
  const map = useMap();

  useEffect(() => {
    if (listings.length === 0) return;

    const validListings = listings.filter(l => l.latitude != null && l.longitude != null);
    if (validListings.length === 0) return;

    const bounds = L.latLngBounds(
      validListings.map((listing) => [listing.latitude!, listing.longitude!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], animate: false });
  }, [listings, map]);

  return null;
}

export default function Map({ listings, listingQuery = '' }: MapProps) {
  // Default center (can be any global point if no listings, typically zoomed out)
  const defaultCenter: [number, number] = [30.7333, 76.7794]; // Chandigarh default

  return (
    <div className="h-full w-full rounded-md overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {listings.map(listing => (
          listing.latitude != null && listing.longitude != null ? (
            <Marker
              key={listing.id}
              position={[listing.latitude, listing.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="max-w-[200px]">
                  <img
                    src={listing.images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'}
                    alt={listing.title}
                    className="w-full h-[120px] object-cover rounded-sm"
                  />
                  <h4 className="mt-2 mb-1 text-sm">{listing.title}</h4>
                  <p className="m-0 font-bold">₹{listing.price_per_night.toLocaleString('en-IN')} / night</p>
                  <Link href={`/listings/${listing.id}${listingQuery}`} className="block mt-2 text-airbnb-pink no-underline font-semibold">
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}

        <MapUpdater listings={listings} />
      </MapContainer>
    </div>
  );
}
