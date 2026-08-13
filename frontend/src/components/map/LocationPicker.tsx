'use client';

import React, { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
});

/** Geographic centre of India — used only until the host places a pin. */
const FALLBACK_CENTER: [number, number] = [20.5937, 78.9629];
const FALLBACK_ZOOM = 4;

interface LocationPickerProps {
    /** `null` means "no pin placed yet" — the map stays zoomed out and shows no marker. */
    latitude: number | null;
    longitude: number | null;
    onChange: (latitude: number, longitude: number) => void;
}

function MapController({ latitude, longitude, onChange }: LocationPickerProps) {
    const map = useMap();

    useEffect(() => {
        if (latitude == null || longitude == null) {
            map.setView(FALLBACK_CENTER, FALLBACK_ZOOM, { animate: false });
        } else {
            map.setView([latitude, longitude], Math.max(map.getZoom(), 15), { animate: false });
        }
        setTimeout(() => map.invalidateSize(), 0);
    }, [latitude, longitude, map]);

    useMapEvents({
        click(event: LeafletMouseEvent) {
            onChange(event.latlng.lat, event.latlng.lng);
        },
    });

    if (latitude == null || longitude == null) return null;

    return (
        <Marker
            position={[latitude, longitude]}
            icon={markerIcon}
            draggable
            eventHandlers={{
                dragend(event) {
                    const position = event.target.getLatLng();
                    onChange(position.lat, position.lng);
                },
            }}
        />
    );
}

export default function LocationPicker(props: LocationPickerProps) {
    const hasPin = props.latitude != null && props.longitude != null;

    return (
        <MapContainer
            center={hasPin ? [props.latitude as number, props.longitude as number] : FALLBACK_CENTER}
            zoom={hasPin ? 15 : FALLBACK_ZOOM}
            scrollWheelZoom={false}
            className="w-full h-full"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapController {...props} />
        </MapContainer>
    );
}