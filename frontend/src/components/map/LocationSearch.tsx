'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IoSearch, IoLocationSharp } from 'react-icons/io5';
import { PlaceSuggestion, searchPlaces } from '@/lib/geocode';

interface LocationSearchProps {
  /** Text currently shown in the box (controlled by the parent). */
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
  placeholder?: string;
}

/**
 * Address autocomplete backed by OpenStreetMap Nominatim.
 * Picking a suggestion hands the parent both the coordinates and the
 * parsed city / state / country so the listing pin can never drift from the text.
 */
export default function LocationSearch({
  value,
  onValueChange,
  onSelect,
  placeholder = 'Search an address, landmark or city',
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const skipNextSearch = useRef(false);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced lookup — Nominatim asks for at most 1 request/second.
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setError('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const results = await searchPlaces(query, controller.signal);
        setSuggestions(results);
        setActiveIndex(-1);
        setIsOpen(true);
        setError(results.length ? '' : 'No match found. Drop the pin on the map instead.');
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setSuggestions([]);
        setError('Address lookup unavailable. Drop the pin on the map instead.');
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  const choose = useCallback(
    (place: PlaceSuggestion) => {
      skipNextSearch.current = true;
      onValueChange(place.label);
      onSelect(place);
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      setError('');
    },
    [onSelect, onValueChange]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <IoSearch size={18} className="absolute left-[14px] text-airbnb-gray pointer-events-none" aria-hidden="true" />
        <input
          className="input w-full pl-10 pr-10"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="location-search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `location-option-${activeIndex}` : undefined}
        />
        {isSearching && <div className="spinner absolute right-[14px] w-4 h-4" aria-label="Searching" />}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          className="absolute z-40 top-[calc(100%+4px)] left-0 right-0 max-h-[260px] overflow-y-auto list-none m-0 p-1.5 bg-airbnb-bg border border-airbnb-border rounded-md shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
          id="location-search-listbox"
          role="listbox"
        >
          {suggestions.map((place, index) => (
            <li key={place.id} role="none">
              <button
                type="button"
                id={`location-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`flex items-start gap-2.5 w-full px-3 py-2.5 border-none rounded-sm text-left text-sm leading-[1.35] cursor-pointer text-airbnb-dark [&>svg]:shrink-0 [&>svg]:mt-0.5 [&>svg]:text-airbnb-gray hover:bg-airbnb-bg-secondary focus-visible:bg-airbnb-bg-secondary ${
                  index === activeIndex ? 'bg-airbnb-bg-secondary' : 'bg-transparent'
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(place)}
              >
                <IoLocationSharp size={16} aria-hidden="true" />
                <span>{place.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1.5 text-xs text-airbnb-gray">{error}</p>}
    </div>
  );
}
