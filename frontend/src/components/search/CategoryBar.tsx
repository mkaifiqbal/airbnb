'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Category } from '@/types';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

interface CategoryBarProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

/** Round scroll arrow; fades out entirely when it can't scroll further. */
const SCROLL_BTN =
  'absolute w-7 h-7 rounded-full border border-airbnb-border bg-airbnb-bg cursor-pointer flex items-center justify-center z-[2] transition-all duration-fast shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:scale-105 disabled:opacity-0 disabled:pointer-events-none max-[768px]:hidden';

/** Category pill: dimmed until hovered or selected, with the Airbnb underline. */
const CATEGORY_ITEM =
  'flex flex-col items-center gap-2 px-1 py-2.5 min-w-fit cursor-pointer border-none bg-transparent transition-all duration-fast border-b-2 whitespace-nowrap';
const CATEGORY_ITEM_IDLE = 'opacity-65 border-b-transparent hover:opacity-100 hover:border-b-airbnb-border';
const CATEGORY_ITEM_ACTIVE = 'opacity-100 border-b-airbnb-dark';

export default function CategoryBar({ categories, activeCategory, onSelect }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 1);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(container);
    window.addEventListener('resize', updateScrollState);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [categories, updateScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -scrollRef.current.clientWidth * 0.75 : scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center py-3 border-b border-airbnb-border-light flex-1 min-w-0 max-[768px]:py-2">
      <button type="button" aria-label="Scroll categories left" disabled={!canScrollLeft} className={`${SCROLL_BTN} left-0.5`} onClick={() => scroll('left')}>
        <IoChevronBack size={14} />
      </button>

      <div
        className="flex gap-8 overflow-x-auto scroll-smooth px-9 min-w-0 flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-[768px]:gap-6"
        ref={scrollRef}
        onScroll={updateScrollState}
      >
        <button
          className={`${CATEGORY_ITEM} ${activeCategory === '' ? CATEGORY_ITEM_ACTIVE : CATEGORY_ITEM_IDLE}`}
          onClick={() => onSelect('')}
        >
          <span className={`text-xs font-semibold ${activeCategory === '' ? 'text-airbnb-dark' : 'text-airbnb-gray'}`}>All</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`${CATEGORY_ITEM} ${activeCategory === cat.name ? CATEGORY_ITEM_ACTIVE : CATEGORY_ITEM_IDLE}`}
            onClick={() => onSelect(cat.name)}
          >
            <span className={`text-xs font-semibold ${activeCategory === cat.name ? 'text-airbnb-dark' : 'text-airbnb-gray'}`}>{cat.name}</span>
          </button>
        ))}
      </div>

      <button type="button" aria-label="Scroll categories right" disabled={!canScrollRight} className={`${SCROLL_BTN} right-0.5`} onClick={() => scroll('right')}>
        <IoChevronForward size={14} />
      </button>
    </div>
  );
}
