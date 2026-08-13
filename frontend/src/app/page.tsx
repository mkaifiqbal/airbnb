'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import dynamic from 'next/dynamic';
import CategoryBar from '@/components/search/CategoryBar';
import FilterModal from '@/components/search/FilterModal';
import ListingCard from '@/components/listings/ListingCard';

const Map = dynamic(() => import('@/components/map/Map'), { ssr: false });
import { getListings, getCategories } from '@/lib/api';
import { Listing, Category, SearchFilters } from '@/types';
import { IoOptions } from 'react-icons/io5';
import toast from 'react-hot-toast';

/* Class recipes shared by the home page layout. */
const FILTER_TAG = 'inline-flex items-center px-3.5 py-1.5 bg-airbnb-bg-secondary rounded-pill text-[13px] font-medium text-airbnb-dark';
const PAGE_BTN =
  'px-4 py-2 rounded-sm underline text-sm font-semibold text-airbnb-dark cursor-pointer bg-transparent border-none flex items-center justify-center transition-all duration-fast whitespace-nowrap enabled:hover:bg-airbnb-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline';
/** Full-height split view used while a search is active (listings + sticky map). */
const MAIN_WITH_MAP =
  'h-[calc(100vh-var(--navbar-height)-77px)] pt-4 px-0 pb-0 overflow-hidden max-[899px]:h-auto max-[899px]:overflow-visible max-[899px]:pb-16';
/** 4-up browse grid; narrows to 2-up when the map takes half the screen. */
const GRID_BROWSE = 'grid grid-cols-4 gap-y-6 gap-x-[18px] max-[1120px]:grid-cols-3 max-[1000px]:grid-cols-2 max-[550px]:grid-cols-1 max-[550px]:gap-8';
const GRID_WITH_MAP = 'grid grid-cols-2 gap-y-6 gap-x-[18px] max-[550px]:grid-cols-1 max-[550px]:gap-8';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    location: searchParams.get('location') || undefined,
    check_in: searchParams.get('checkIn') || undefined,
    check_out: searchParams.get('checkOut') || undefined,
    guests: Number(searchParams.get('guests')) || undefined,
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const hasActiveSearch = Object.values(filters).some(val => val !== undefined);
  const listingParams = new URLSearchParams();
  if (filters.check_in) listingParams.set('checkIn', filters.check_in);
  if (filters.check_out) listingParams.set('checkOut', filters.check_out);
  if (filters.guests) listingParams.set('guests', String(filters.guests));
  const listingQuery = listingParams.size ? `?${listingParams.toString()}` : '';
  /** The map takes half the row while searching, so the cards drop to a 2-up grid. */
  const gridClass = hasActiveSearch ? GRID_WITH_MAP : GRID_BROWSE;

  const clearAll = () => {
    setFilters({});
    setActiveCategory('');
    setCurrentPage(1);
    router.replace('/', { scroll: false });
  };

  // Fetch categories on mount
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);



  // Fetch listings whenever filters change
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getListings({
        ...filters,
        category: activeCategory || undefined,
        page: currentPage,
        per_page: 12,
      });
      setListings(response.listings);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, activeCategory, currentPage]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (searchData: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => {
    setFilters((prev) => ({
      ...prev,
      location: searchData.location || undefined,
      check_in: searchData.checkIn || undefined,
      check_out: searchData.checkOut || undefined,
      guests: searchData.guests > 0 ? searchData.guests : undefined,
    }));
    setCurrentPage(1);
  };

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleFilterApply = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  return (
    <>
      <Navbar onSearch={handleSearch} onLogoClick={clearAll} />

      <div className="sticky top-[var(--navbar-height)] bg-airbnb-bg z-50">
        <div className="container-wide">
          <div className="flex items-center gap-4">
            <CategoryBar
              categories={categories}
              activeCategory={activeCategory}
              onSelect={handleCategorySelect}
            />
            <button
              className="flex items-center gap-2 px-4 py-2.5 border border-airbnb-border rounded-md text-sm font-semibold bg-airbnb-bg cursor-pointer transition-all duration-fast whitespace-nowrap shrink-0 hover:border-airbnb-dark"
              onClick={() => setShowFilters(true)}
            >
              <IoOptions size={16} />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      <main className={hasActiveSearch ? MAIN_WITH_MAP : 'pt-6 px-0 pb-16'}>
        <div className={`container-wide ${hasActiveSearch ? 'h-full flex flex-col' : ''}`}>
          {/* Active filters indicator */}
          {(filters.location || filters.min_price || filters.property_type) && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {filters.location && (
                <span className={FILTER_TAG}>📍 {filters.location}</span>
              )}
              {filters.min_price && (
                <span className={FILTER_TAG}>₹{filters.min_price}+</span>
              )}
              {filters.property_type && (
                <span className={FILTER_TAG}>{filters.property_type}</span>
              )}
              <button
                className="text-[13px] font-semibold underline text-airbnb-dark cursor-pointer bg-transparent border-none px-2 py-1.5"
                onClick={clearAll}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Content Layout: Split screen */}
          <div className={hasActiveSearch ? 'flex gap-6 min-h-0 flex-1 overflow-hidden max-[899px]:h-auto max-[899px]:overflow-visible' : ''}>
            {/* Left: Listings Grid */}
            <div className={hasActiveSearch ? 'flex-1 min-w-0 overflow-y-auto pt-0 pr-2.5 pb-8 pl-0 [scrollbar-gutter:stable] max-[899px]:overflow-visible max-[899px]:pr-0' : ''}>
              {isLoading ? (
                <div className={gridClass}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-full">
                      <div className="skeleton skeleton-card" />
                      <div className="skeleton skeleton-text mt-3" />
                      <div className="skeleton skeleton-text-sm" />
                      <div className="skeleton skeleton-text-sm" />
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-20 px-5">
                  <h2 className="text-xl mb-2">No listings found</h2>
                  <p className="text-base text-airbnb-gray mb-6">Try adjusting your search or filters to find what you&apos;re looking for.</p>
                  <button className="btn btn-primary" onClick={clearAll}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={gridClass}>
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} searchQuery={listingQuery} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-1 mt-12">
                      <button
                        className={PAGE_BTN}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        className={PAGE_BTN}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right: Map */}
            {hasActiveSearch && (
              <div className="flex-[0_0_min(44vw,560px)] h-full rounded-lg overflow-hidden hidden min-[900px]:block">
                <Map listings={listings} listingQuery={listingQuery} />
              </div>
            )}
          </div>
        </div>
      </main>

      {showFilters && (
        <FilterModal
          onClose={() => setShowFilters(false)}
          onApply={handleFilterApply}
          initialFilters={filters}
        />
      )}
    </>
  );
}
