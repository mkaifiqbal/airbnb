'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  bookedRanges?: Array<{ check_in: string; check_out: string }>;
  placeholder?: string;
  align?: 'left' | 'right' | 'center';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* Class recipes for the popup calendar. */
const ALIGN_CLASS: Record<'left' | 'right' | 'center', string> = {
  left: 'left-0',
  right: 'right-0',
  center: 'left-1/2 -translate-x-1/2',
};
const NAV_BTN = 'w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-fast text-airbnb-dark border-none bg-transparent hover:bg-airbnb-bg-secondary';
const DAY_CELL = 'aspect-square flex items-center justify-center text-sm font-medium rounded-full cursor-pointer transition-all duration-fast border-none bg-transparent relative max-[480px]:text-[13px]';
/** Diagonal hatching that marks nights already booked. */
const BOOKED_CELL = '!text-airbnb-gray-light cursor-not-allowed [background:repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.04)_2px,rgba(0,0,0,0.04)_4px)]';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isDateBooked(date: Date, bookedRanges: Array<{ check_in: string; check_out: string }>): boolean {
  const dateStr = formatDate(date);
  return bookedRanges.some(range => dateStr >= range.check_in && dateStr < range.check_out);
}

export default function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  bookedRanges = [],
  placeholder = 'Select date',
  align = 'left',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(selected?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

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

  const goToPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const minD = minDate ? parseDate(minDate) : null;
  const maxD = maxDate ? parseDate(maxDate) : null;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  const isDisabled = (date: Date): boolean => {
    if (minD && date < minD) return true;
    if (maxD && date > maxD) return true;
    if (isDateBooked(date, bookedRanges)) return true;
    return false;
  };

  const handleSelect = (date: Date) => {
    if (isDisabled(date)) return;
    onChange(formatDate(date));
    setIsOpen(false);
  };

  const displayValue = selected
    ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="relative" ref={containerRef}>
      <div className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {label && <label className="block text-[10px] font-bold uppercase text-airbnb-dark mb-1 tracking-[0.04em]">{label}</label>}
        <div className={`text-sm py-0.5 transition-colors duration-fast min-h-5 flex items-center ${isOpen ? 'text-airbnb-pink' : 'text-airbnb-dark'}`}>
          {displayValue || <span className="text-airbnb-gray-light font-normal">{placeholder}</span>}
        </div>
      </div>

      {isOpen && (
        <div
          className={`absolute top-[calc(100%+8px)] bg-airbnb-bg rounded-lg shadow-dropdown p-5 z-[1000] w-80 animate-calendarSlideIn max-[480px]:w-[calc(100vw-2rem)] max-[480px]:p-4 max-[768px]:left-0 ${ALIGN_CLASS[align]}`}
        >
          {/* Month navigation */}
          <div className="flex justify-between items-center mb-4">
            <button className={NAV_BTN} onClick={goToPrev} type="button" aria-label="Previous month">
              <IoChevronBack size={18} />
            </button>
            <span className="text-base font-bold text-airbnb-dark">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button className={NAV_BTN} onClick={goToNext} type="button" aria-label="Next month">
              <IoChevronForward size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {DAYS.map((d) => (
              <span key={d} className="text-center text-xs font-semibold text-airbnb-gray py-1">{d}</span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((date, i) => {
              if (!date) return <span key={`empty-${i}`} className="aspect-square" />;

              const disabled = isDisabled(date);
              const isToday = isSameDay(date, today);
              const isSelected = selected ? isSameDay(date, selected) : false;
              const booked = isDateBooked(date, bookedRanges);

              return (
                <button
                  key={`day-${date.getDate()}`}
                  type="button"
                  className={[
                    DAY_CELL,
                    isSelected
                      ? '!bg-airbnb-dark !text-white font-bold'
                      : 'text-airbnb-dark',
                    !disabled && !isSelected ? 'hover:bg-airbnb-bg-secondary hover:border hover:border-airbnb-dark' : '',
                    isToday && !isSelected
                      ? 'font-bold text-airbnb-pink after:content-[""] after:absolute after:bottom-[3px] after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-airbnb-pink'
                      : '',
                    disabled ? '!text-airbnb-gray-light cursor-not-allowed line-through opacity-40' : '',
                    booked ? BOOKED_CELL : '',
                  ].join(' ')}
                  onClick={() => handleSelect(date)}
                  disabled={disabled}
                  aria-label={`${date.toLocaleDateString()}${booked ? ', booked' : ''}`}
                  title={booked ? 'Booked' : undefined}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-airbnb-border-light">
            {bookedRanges.length > 0 && <span className="mr-auto text-[11px] text-airbnb-gray">Crossed out: booked</span>}
            <button
              type="button"
              className="text-sm font-semibold underline text-airbnb-dark cursor-pointer border-none bg-transparent px-2 py-1.5 rounded-sm transition-colors duration-fast hover:bg-airbnb-bg-secondary"
              onClick={() => { onChange(''); setIsOpen(false); }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-sm font-semibold text-white bg-airbnb-dark border-none px-4 py-2 rounded-pill cursor-pointer transition-opacity duration-fast hover:opacity-85"
              onClick={() => { onChange(formatDate(today)); setIsOpen(false); }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
