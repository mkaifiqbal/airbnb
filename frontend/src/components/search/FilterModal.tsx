'use client';

import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';

interface FilterModalProps {
  onClose: () => void;
  onApply: (filters: {
    min_price?: number;
    max_price?: number;
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string;
  }) => void;
  initialFilters?: any;
}

const PROPERTY_TYPES = ['Any', 'House', 'Apartment', 'Villa', 'Cabin', 'Cottage', 'Treehouse', 'Tiny Home', 'Bungalow', 'Chalet', 'Dome'];
const AMENITIES = ['WiFi', 'Kitchen', 'Pool', 'Air Conditioning', 'Parking', 'TV', 'Washer', 'Dryer', 'Hot Tub', 'Fireplace', 'Gym', 'Beach Access', 'Mountain View', 'Lake View', 'Garden', 'BBQ Grill'];

/* Shared chip / counter recipes so every pill in the modal stays identical. */
const CHIP = 'px-4 py-2 border rounded-pill text-sm cursor-pointer transition-all duration-fast text-airbnb-dark';
const CHIP_IDLE = 'bg-airbnb-bg border-airbnb-border hover:border-airbnb-dark';
const TYPE_CHIP_ACTIVE = 'bg-airbnb-dark text-white border-airbnb-dark';
const AMENITY_CHIP_ACTIVE = 'bg-airbnb-bg-secondary border-airbnb-dark';
const COUNTER_BTN = 'w-8 h-8 rounded-full border border-airbnb-border bg-airbnb-bg flex items-center justify-center text-lg cursor-pointer transition-colors duration-fast hover:border-airbnb-dark';
const SECTION_TITLE = 'text-lg font-semibold mb-1';

export default function FilterModal({ onClose, onApply, initialFilters = {} }: FilterModalProps) {
  const [minPrice, setMinPrice] = useState<number>(initialFilters.min_price || 0);
  const [maxPrice, setMaxPrice] = useState<number>(initialFilters.max_price || 50000);
  const [propertyType, setPropertyType] = useState<string>(initialFilters.property_type || 'Any');
  const [bedrooms, setBedrooms] = useState<number>(initialFilters.bedrooms || 0);
  const [bathrooms, setBathrooms] = useState<number>(initialFilters.bathrooms || 0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilters.amenities ? initialFilters.amenities.split(',') : []
  );

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleApply = () => {
    onApply({
      min_price: minPrice > 0 ? minPrice : undefined,
      max_price: maxPrice < 50000 ? maxPrice : undefined,
      property_type: propertyType !== 'Any' ? propertyType : undefined,
      bedrooms: bedrooms > 0 ? bedrooms : undefined,
      bathrooms: bathrooms > 0 ? bathrooms : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities.join(',') : undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setMinPrice(0);
    setMaxPrice(50000);
    setPropertyType('Any');
    setBedrooms(0);
    setBathrooms(0);
    setSelectedAmenities([]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-[760px] max-[768px]:max-w-full" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            <IoClose size={20} />
          </button>
          <h2>Filters</h2>
          <div className="w-8" />
        </div>

        <div className="px-6 pb-6 max-h-[65vh] overflow-y-auto">
          {/* Price Range */}
          <section className="py-6">
            <h3 className={SECTION_TITLE}>Price range</h3>
            <p className="text-sm text-airbnb-gray mb-4">Nightly prices before fees and taxes</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-airbnb-gray mb-1">Minimum</label>
                <div className="flex items-center border border-airbnb-border rounded-sm px-3 py-2.5">
                  <span className="text-base text-airbnb-gray mr-1">₹</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    min={0}
                    className="border-none outline-none w-full text-base"
                  />
                </div>
              </div>
              <span className="text-xl text-airbnb-gray mt-[18px]">–</span>
              <div className="flex-1">
                <label className="block text-xs text-airbnb-gray mb-1">Maximum</label>
                <div className="flex items-center border border-airbnb-border rounded-sm px-3 py-2.5">
                  <span className="text-base text-airbnb-gray mr-1">₹</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    min={0}
                    className="border-none outline-none w-full text-base"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="divider" />

          {/* Property Type */}
          <section className="py-6">
            <h3 className={SECTION_TITLE}>Type of place</h3>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  className={`${CHIP} ${propertyType === type ? TYPE_CHIP_ACTIVE : CHIP_IDLE}`}
                  onClick={() => setPropertyType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          <div className="divider" />

          {/* Rooms */}
          <section className="py-6">
            <h3 className={SECTION_TITLE}>Rooms and beds</h3>
            <div className="flex justify-between items-center py-3 text-base">
              <span>Bedrooms</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setBedrooms(Math.max(0, bedrooms - 1))} className={COUNTER_BTN} aria-label="Decrease bedrooms">−</button>
                <span className="min-w-8 text-center text-base">{bedrooms === 0 ? 'Any' : bedrooms}</span>
                <button onClick={() => setBedrooms(bedrooms + 1)} className={COUNTER_BTN} aria-label="Increase bedrooms">+</button>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 text-base">
              <span>Bathrooms</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setBathrooms(Math.max(0, bathrooms - 1))} className={COUNTER_BTN} aria-label="Decrease bathrooms">−</button>
                <span className="min-w-8 text-center text-base">{bathrooms === 0 ? 'Any' : bathrooms}</span>
                <button onClick={() => setBathrooms(bathrooms + 1)} className={COUNTER_BTN} aria-label="Increase bathrooms">+</button>
              </div>
            </div>
          </section>

          <div className="divider" />

          {/* Amenities */}
          <section className="py-6">
            <h3 className={SECTION_TITLE}>Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  className={`${CHIP} ${selectedAmenities.includes(amenity) ? AMENITY_CHIP_ACTIVE : CHIP_IDLE}`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button
            className="text-base font-semibold underline text-airbnb-dark cursor-pointer bg-transparent border-none p-2 hover:text-airbnb-pink"
            onClick={handleClear}
          >
            Clear all
          </button>
          <button className="btn btn-primary btn-pill" onClick={handleApply}>
            Show places
          </button>
        </div>
      </div>
    </div>
  );
}
