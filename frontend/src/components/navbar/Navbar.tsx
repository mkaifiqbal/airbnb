'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import LoginModal from '@/components/ui/LoginModal';
import DatePicker from '@/components/ui/DatePicker';
import GuestPicker from '@/components/ui/GuestPicker';
import { FiMenu, FiGlobe, FiSearch } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';

interface NavbarProps {
  onSearch?: (filters: { location: string; checkIn: string; checkOut: string; guests: number }) => void;
  onLogoClick?: () => void;
}

function nextDate(date: string): string {
  if (!date) return new Date().toISOString().split('T')[0];
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + 1);
  return value.toISOString().split('T')[0];
}

export default function Navbar({ onSearch, onLogoClick }: NavbarProps) {
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  /**
   * Auth is restored from localStorage inside the provider, which lives outside this
   * page's Suspense boundary and can therefore commit before the navbar hydrates.
   * Rendering the guest markup until this component itself has mounted keeps the first
   * client render byte-identical to the server HTML.
   */
  const [isMounted, setIsMounted] = useState(false);
  const isSignedIn = isMounted && isAuthenticated;
  const router = useRouter();
  const searchParams = useSearchParams();

  const clearFiltersAndNavigate = () => {
    // Clear all search parameters by pushing to root with empty params
    router.push('/', { scroll: false });
  };
  const menuRef = useRef<HTMLDivElement>(null);


  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchLocation, setSearchLocation] = useState(searchParams.get('location') || '');
  const [searchCheckIn, setSearchCheckIn] = useState(searchParams.get('checkIn') || '');
  const [searchCheckOut, setSearchCheckOut] = useState(searchParams.get('checkOut') || '');
  const [searchGuests, setSearchGuests] = useState(parseInt(searchParams.get('guests') || '1', 10));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSearchLocation(searchParams.get('location') || '');
    setSearchCheckIn(searchParams.get('checkIn') || '');
    setSearchCheckOut(searchParams.get('checkOut') || '');
    setSearchGuests(parseInt(searchParams.get('guests') || '1', 10));
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation.trim()) params.set('location', searchLocation.trim());
    if (searchCheckIn) params.set('checkIn', searchCheckIn);
    if (searchCheckOut) params.set('checkOut', searchCheckOut);
    if (searchGuests > 0) params.set('guests', searchGuests.toString());

    if (onSearch) {
      onSearch({
        location: searchLocation.trim(),
        checkIn: searchCheckIn,
        checkOut: searchCheckOut,
        guests: searchGuests,
      });
      router.replace(`/?${params.toString()}`, { scroll: false });
    } else {
      router.push(`/?${params.toString()}`);
    }
    setSearchExpanded(false);
  };

  return (
    <>
      <nav className={`sticky top-0 bg-airbnb-bg border-b border-airbnb-border z-[100] ${searchExpanded ? 'h-auto' : 'h-[var(--navbar-height)]'}`}>
        <div className="max-w-wide mx-auto px-10 h-[var(--navbar-height)] flex items-center justify-between max-[1128px]:px-6 max-[768px]:px-4">
          {/* Logo */}
          <button
            onClick={() => {
              if (onLogoClick) {
                onLogoClick();
              } else {
                clearFiltersAndNavigate();
              }
            }}
            className="flex items-center gap-1.5 no-underline shrink-0 bg-transparent border-none cursor-pointer p-0"
          >
            <svg width="30" height="32" viewBox="0 0 30 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 0C15 0 0 14.2 0 21.4C0 27.2 6.7 32 15 32C23.3 32 30 27.2 30 21.4C30 14.2 15 0 15 0ZM15 28.8C8.6 28.8 3.4 25.2 3.4 21.4C3.4 17.2 11.6 7.6 15 3.6C18.4 7.6 26.6 17.2 26.6 21.4C26.6 25.2 21.4 28.8 15 28.8Z" fill="#FF385C"/>
            </svg>
            <span className="text-[22px] font-extrabold text-airbnb-pink tracking-tight max-[768px]:hidden">airbnb</span>
          </button>

          {/* Search Bar — collapsed pill (always visible in top row) */}
          {!searchExpanded && (
            <button
              className="flex items-center border border-airbnb-border rounded-pill py-[7px] pr-[7px] pl-5 shadow-search hover:shadow-search-hover transition-shadow duration-base cursor-pointer bg-airbnb-bg max-[768px]:pl-3 max-[768px]:py-1.5"
              onClick={() => setSearchExpanded(true)}
            >
              <span className="text-sm font-semibold text-airbnb-dark px-4 max-[768px]:px-2 max-[768px]:text-xs">{searchLocation || 'Anywhere'}</span>
              <span className="w-px h-6 bg-airbnb-border" />
              <span className="text-sm font-semibold text-airbnb-dark px-4 max-[768px]:hidden">
                {searchCheckIn && searchCheckOut
                  ? `${new Date(searchCheckIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(searchCheckOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : 'Any week'}
              </span>
              <span className="w-px h-6 bg-airbnb-border max-[768px]:hidden" />
              <span className="text-sm text-airbnb-gray px-4 max-[768px]:hidden">
                {searchGuests > 1 ? `${searchGuests} guests` : 'Add guests'}
              </span>
              <span className="flex items-center justify-center w-8 h-8 bg-airbnb-pink text-white rounded-full ml-2 max-[768px]:w-7 max-[768px]:h-7">
                <FiSearch size={14} />
              </span>
            </button>
          )}

          {/* Right Section */}
          <div className={`flex items-center gap-1 shrink-0 ${searchExpanded ? 'max-[768px]:hidden' : ''}`}>
            {isSignedIn && user?.is_host ? (
              <Link href="/host" className="px-3 py-3 text-sm font-semibold text-airbnb-dark rounded-pill hover:bg-airbnb-bg-secondary transition-colors duration-fast whitespace-nowrap no-underline max-[768px]:hidden">
                Host Dashboard
              </Link>
            ) : (
              <button
                className="px-3 py-3 text-sm font-semibold text-airbnb-dark rounded-pill hover:bg-airbnb-bg-secondary transition-colors duration-fast whitespace-nowrap max-[768px]:hidden"
                onClick={() => isSignedIn ? switchRole() : setShowLoginModal(true)}
              >
                Become a Host
              </button>
            )}

            <button className="p-3 rounded-full hover:bg-airbnb-bg-secondary transition-colors duration-fast flex items-center max-[768px]:hidden">
              <FiGlobe size={16} />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                className="flex items-center gap-3 py-[5px] pr-[5px] pl-3 border border-airbnb-border rounded-pill hover:shadow-search-hover transition-shadow duration-fast bg-airbnb-bg"
                onClick={() => setShowMenu(!showMenu)}
              >
                <FiMenu size={16} />
                {isSignedIn && user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || 'User'}
                    className="w-[30px] h-[30px] rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=FF385C&color=fff&size=100`;
                    }}
                  />
                ) : (
                  <FaUserCircle size={30} color="#717171" />
                )}
              </button>

              {showMenu && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-60 bg-airbnb-bg rounded-md shadow-airbnb-lg py-2 z-[200] animate-slideDown">
                  {isSignedIn ? (
                    <>
                      <div className="px-4 py-3 flex flex-col gap-0.5">
                        <strong className="text-sm">{user?.name}</strong>
                        <span className="text-xs text-airbnb-gray">{user?.email}</span>
                      </div>
                      <div className="h-px bg-airbnb-border-light my-1" />
                      <Link href="/trips" className="block w-full px-4 py-2.5 text-left text-sm text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast no-underline" onClick={() => setShowMenu(false)}>
                        Trips
                      </Link>
                      <Link href="/wishlists" className="block w-full px-4 py-2.5 text-left text-sm text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast no-underline" onClick={() => setShowMenu(false)}>
                        Wishlists
                      </Link>
                      <div className="h-px bg-airbnb-border-light my-1" />
                      {user?.is_host ? (
                        <>
                          <Link href="/host" className="block w-full px-4 py-2.5 text-left text-sm text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast no-underline" onClick={() => setShowMenu(false)}>
                            Host Dashboard
                          </Link>
                          <Link href="/host/create" className="block w-full px-4 py-2.5 text-left text-sm text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast no-underline" onClick={() => setShowMenu(false)}>
                            Create Listing
                          </Link>
                          <button className="block w-full px-4 py-2.5 text-left text-sm text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast cursor-pointer border-none bg-transparent" onClick={() => { switchRole(); setShowMenu(false); }}>
                            Switch to Guest
                          </button>
                        </>
                      ) : (
                        <button className="block w-full px-4 py-2.5 text-left text-sm text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast cursor-pointer border-none bg-transparent" onClick={() => { switchRole(); setShowMenu(false); }}>
                          Switch to Host
                        </button>
                      )}
                      <div className="h-px bg-airbnb-border-light my-1" />
                      <button className="block w-full px-4 py-2.5 text-left text-sm text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast cursor-pointer border-none bg-transparent" onClick={() => { logout(); setShowMenu(false); }}>
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast cursor-pointer border-none bg-transparent"
                        onClick={() => { setShowLoginModal(true); setShowMenu(false); }}
                      >
                        Log in
                      </button>
                      <button
                        className="block w-full px-4 py-2.5 text-left text-sm text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast cursor-pointer border-none bg-transparent"
                        onClick={() => { setShowLoginModal(true); setShowMenu(false); }}
                      >
                        Sign up
                      </button>
                      <div className="h-px bg-airbnb-border-light my-1" />
                      <Link
                        href="/"
                        className="block w-full px-4 py-2.5 text-left text-sm text-airbnb-dark hover:bg-airbnb-bg-secondary transition-colors duration-fast cursor-pointer border-none bg-transparent"
                        onClick={clearFiltersAndNavigate}
                      >
                        Become a Host
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded search — full-width row below the logo/menu row on mobile */}
        {searchExpanded && (
          <div className="px-10 pb-3 max-[1128px]:px-6 max-[768px]:px-4 max-[768px]:pb-4">
            <form
              className="flex items-center border border-airbnb-border rounded-pill bg-airbnb-bg shadow-[0_3px_12px_rgba(0,0,0,0.15)] w-full max-w-[720px] mx-auto animate-slideDown max-[768px]:flex-col max-[768px]:rounded-xl max-[768px]:max-w-full"
              onSubmit={(event) => { event.preventDefault(); handleSearch(); }}
            >
              <div className="py-2 px-6 flex-1 min-w-0 max-[768px]:w-full max-[768px]:px-4 max-[768px]:pt-3">
                <label className="block text-xs font-bold text-airbnb-dark mb-0.5">Where</label>
                <input
                  type="text"
                  placeholder="Search destinations"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  autoFocus
                  className="border-none outline-none text-sm text-airbnb-gray w-full bg-transparent"
                />
              </div>
              <div className="w-px h-8 bg-airbnb-border shrink-0 max-[768px]:w-full max-[768px]:h-px" />
              <div className="py-2 px-6 flex-1 min-w-0 max-[768px]:w-full max-[768px]:px-4">
                <DatePicker
                  label="Check in"
                  value={searchCheckIn}
                  onChange={setSearchCheckIn}
                  minDate={new Date().toISOString().split('T')[0]}
                  placeholder="Add dates"
                  align="left"
                />
              </div>
              <div className="w-px h-8 bg-airbnb-border shrink-0 max-[768px]:w-full max-[768px]:h-px" />
              <div className="py-2 px-6 flex-1 min-w-0 max-[768px]:w-full max-[768px]:px-4">
                <DatePicker
                  label="Check out"
                  value={searchCheckOut}
                  onChange={setSearchCheckOut}
                  minDate={nextDate(searchCheckIn)}
                  placeholder="Add dates"
                  align="left"
                />
              </div>
              <div className="w-px h-8 bg-airbnb-border shrink-0 max-[768px]:w-full max-[768px]:h-px" />
              <div className="flex items-center gap-2 py-2 pr-2 pl-6 max-[768px]:w-full max-[768px]:px-4 max-[768px]:pb-3 max-[768px]:justify-between">
                <div className="relative flex-1">
                  <GuestPicker
                    label="Who"
                    value={searchGuests}
                    onChange={setSearchGuests}
                    align="right"
                  />
                </div>
                <button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white border-none rounded-pill px-5 py-3 text-base font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-fast whitespace-nowrap">
                  <FiSearch size={16} />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Click-away overlay */}
        {searchExpanded && (
          <div className="fixed inset-0 top-[var(--navbar-height)] bg-black/25 -z-[1]" onClick={() => setSearchExpanded(false)} />
        )}
      </nav>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </>
  );
}
