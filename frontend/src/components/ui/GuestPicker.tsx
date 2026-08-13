'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';

interface GuestPickerProps {
  label?: string;
  value: number;
  onChange: (guests: number) => void;
  placeholder?: string;
  align?: 'left' | 'right' | 'center';
  /** Maximum adults + children allowed (excludes infants and pets). */
  maxGuests?: number;
}

/* Class recipes for the popup rows. */
const ALIGN_CLASS: Record<'left' | 'right' | 'center', string> = {
  left: 'left-0',
  right: 'right-0',
  center: 'left-1/2 -translate-x-1/2',
};
const ROW = 'flex items-center justify-between py-6 border-b border-airbnb-border first:pt-2 last:border-b-0 last:pb-2';
const CONTROL_BTN =
  'flex items-center justify-center w-8 h-8 rounded-full border border-airbnb-gray-light bg-transparent text-airbnb-gray cursor-pointer transition-all duration-fast enabled:hover:border-airbnb-dark enabled:hover:text-airbnb-dark disabled:opacity-30 disabled:cursor-not-allowed';
const COUNT = 'w-4 text-center text-base text-airbnb-dark';
const ROW_TITLE = 'text-base font-semibold text-airbnb-dark mb-1';
const ROW_SUBTITLE = 'text-sm text-airbnb-gray';

export default function GuestPicker({
  label,
  value,
  onChange,
  placeholder = 'Add guests',
  align = 'left',
  maxGuests = 16,
}: GuestPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local state for detailed guests
  const [adults, setAdults] = useState(Math.min(Math.max(1, value), maxGuests));
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [pets, setPets] = useState(0);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const updateGuests = (newAdults: number, newChildren: number) => {
    const safeAdults = Math.max(1, newAdults);
    const safeChildren = Math.max(0, newChildren);
    if (safeAdults + safeChildren > maxGuests) return;
    setAdults(safeAdults);
    setChildren(safeChildren);
    onChange(safeAdults + safeChildren);
  };

  const formatDisplay = () => {
    const totalGuests = adults + children;
    if (totalGuests === 0 && infants === 0 && pets === 0) return '';
    
    const parts = [];
    if (totalGuests > 0) parts.push(`${totalGuests} guest${totalGuests > 1 ? 's' : ''}`);
    if (infants > 0) parts.push(`${infants} infant${infants > 1 ? 's' : ''}`);
    if (pets > 0) parts.push(`${pets} pet${pets > 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  const displayValue = formatDisplay();

  return (
    <div className="relative" ref={containerRef}>
      <div className="cursor-pointer h-full" onClick={() => setIsOpen(!isOpen)}>
        {label && <label className="block text-[10px] font-bold uppercase text-airbnb-dark mb-1 tracking-[0.04em]">{label}</label>}
        <div className={`text-sm py-0.5 transition-colors duration-fast min-h-5 flex items-center whitespace-nowrap overflow-hidden text-ellipsis ${isOpen ? 'text-airbnb-pink' : 'text-airbnb-dark'}`}>
          {displayValue || <span className="text-airbnb-gray-light font-normal">{placeholder}</span>}
        </div>
      </div>

      {isOpen && (
        <div className={`absolute top-[calc(100%+8px)] bg-airbnb-bg rounded-lg shadow-dropdown px-6 py-4 z-[1000] w-[340px] animate-calendarSlideIn max-[768px]:left-0 max-[768px]:right-auto max-[768px]:w-[calc(100vw-2rem)] ${ALIGN_CLASS[align]}`}>
          {/* Adults */}
          <div className={ROW}>
            <div className="flex flex-col">
              <div className={ROW_TITLE}>Adults</div>
              <div className={ROW_SUBTITLE}>Ages 13 or above</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className={CONTROL_BTN}
                onClick={() => updateGuests(adults - 1, children)}
                disabled={adults <= 1}
                aria-label="Remove adult"
              >
                <FiMinus />
              </button>
              <span className={COUNT}>{adults}</span>
              <button
                type="button"
                className={CONTROL_BTN}
                onClick={() => updateGuests(adults + 1, children)}
                disabled={adults + children >= maxGuests}
                aria-label="Add adult"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className={ROW}>
            <div className="flex flex-col">
              <div className={ROW_TITLE}>Children</div>
              <div className={ROW_SUBTITLE}>Ages 2-12</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className={CONTROL_BTN}
                onClick={() => updateGuests(adults, children - 1)}
                disabled={children <= 0}
                aria-label="Remove child"
              >
                <FiMinus />
              </button>
              <span className={COUNT}>{children}</span>
              <button
                type="button"
                className={CONTROL_BTN}
                onClick={() => updateGuests(adults, children + 1)}
                disabled={adults + children >= maxGuests}
                aria-label="Add child"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Infants */}
          <div className={ROW}>
            <div className="flex flex-col">
              <div className={ROW_TITLE}>Infants</div>
              <div className={ROW_SUBTITLE}>Under 2</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className={CONTROL_BTN}
                onClick={() => setInfants(Math.max(0, infants - 1))}
                disabled={infants <= 0}
                aria-label="Remove infant"
              >
                <FiMinus />
              </button>
              <span className={COUNT}>{infants}</span>
              <button
                type="button"
                className={CONTROL_BTN}
                onClick={() => setInfants(infants + 1)}
                disabled={infants >= 5}
                aria-label="Add infant"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Pets */}
          <div className={ROW}>
            <div className="flex flex-col">
              <div className={ROW_TITLE}>Pets</div>
              <a href="#" className="text-sm text-airbnb-gray underline">Bringing a service animal?</a>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className={CONTROL_BTN}
                onClick={() => setPets(Math.max(0, pets - 1))}
                disabled={pets <= 0}
                aria-label="Remove pet"
              >
                <FiMinus />
              </button>
              <span className={COUNT}>{pets}</span>
              <button
                type="button"
                className={CONTROL_BTN}
                onClick={() => setPets(pets + 1)}
                disabled={pets >= 5}
                aria-label="Add pet"
              >
                <FiPlus />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
