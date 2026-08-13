'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import { getListings, getHostBookings, deleteListing } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Listing, Booking } from '@/types';
import { IoAdd, IoTrash, IoPencil, IoStar } from 'react-icons/io5';
import toast from 'react-hot-toast';

/* Class recipes for the host dashboard. */
const TAB = 'px-1 py-3 text-sm font-semibold border-b-2 transition-all duration-fast';
const TAB_IDLE = 'text-airbnb-gray border-b-transparent hover:text-airbnb-dark';
const TAB_ACTIVE = 'text-airbnb-dark border-b-airbnb-dark';
const STAT_CARD = 'p-6 border border-airbnb-border-light rounded-md text-center';
const ICON_BTN = 'w-8 h-8 rounded-sm border border-airbnb-border flex items-center justify-center transition-all duration-fast';
const TH = 'text-left p-3 text-xs font-bold uppercase text-airbnb-gray border-b border-airbnb-border-light';
const TD = 'px-3 py-4 border-b border-airbnb-border-light text-sm';
/** Booking status pill colours, matching the old `.s_*` rules. */
const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-[#E7F9E7] text-[#008A05]',
  cancelled: 'bg-[#FFE8E8] text-[#C13515]',
  completed: 'bg-[#F0F0F0] text-airbnb-gray',
};

export default function HostDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings'>('listings');

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !user?.is_host) {
      toast.error('Host access required');
      router.push('/');
      return;
    }
    Promise.all([
      getListings({ per_page: 50 }),
      getHostBookings(),
    ])
      .then(([listingsRes, bookingsData]) => {
        setListings(listingsRes.listings.filter((l) => l.host_id === user.id));
        setBookings(bookingsData);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, isAuthenticated, user, router]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success('Listing deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return <><Navbar /><div className="page-loading"><div className="spinner spinner-lg" /></div></>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-6 px-0 pb-16">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl">Welcome back, {user?.name?.split(' ')[0]}</h1>
              {user?.is_superhost && <span className="text-sm text-airbnb-pink font-semibold">⭐ Superhost</span>}
            </div>
            <Link href="/host/create" className="btn btn-primary btn-pill">
              <IoAdd size={20} />
              Create listing
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-[900px]:grid-cols-1">
            <div className={STAT_CARD}>
              <span className="block text-[28px] font-bold text-airbnb-dark">{listings.length}</span>
              <span className="block text-sm text-airbnb-gray mt-1">Active Listings</span>
            </div>
            <div className={STAT_CARD}>
              <span className="block text-[28px] font-bold text-airbnb-dark">{bookings.filter((b) => b.status === 'confirmed').length}</span>
              <span className="block text-sm text-airbnb-gray mt-1">Upcoming Bookings</span>
            </div>
            <div className={STAT_CARD}>
              <span className="block text-[28px] font-bold text-airbnb-dark">₹{bookings.filter((b) => b.status !== 'cancelled').reduce((sum, b) => sum + b.total_price, 0).toLocaleString('en-IN')}</span>
              <span className="block text-sm text-airbnb-gray mt-1">Total Earnings</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-airbnb-border-light">
            <button className={`${TAB} ${activeTab === 'listings' ? TAB_ACTIVE : TAB_IDLE}`} onClick={() => setActiveTab('listings')}>
              My Listings ({listings.length})
            </button>
            <button className={`${TAB} ${activeTab === 'bookings' ? TAB_ACTIVE : TAB_IDLE}`} onClick={() => setActiveTab('bookings')}>
              Bookings ({bookings.length})
            </button>
          </div>

          {activeTab === 'listings' ? (
            <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
              {listings.length === 0 ? (
                <div className="text-center py-[60px] px-5 col-span-full">
                  <h2 className="mb-2">No listings yet</h2>
                  <p className="text-airbnb-gray mb-6">Create your first listing and start hosting!</p>
                  <Link href="/host/create" className="btn btn-primary btn-pill">Create listing</Link>
                </div>
              ) : (
                listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex gap-4 p-4 border border-airbnb-border-light rounded-md transition-shadow duration-fast hover:shadow-airbnb-card max-[768px]:flex-col"
                  >
                    <img
                      src={listing.images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop'}
                      alt={listing.title}
                      className="w-40 h-[120px] object-cover rounded-sm shrink-0 max-[768px]:w-full max-[768px]:h-[180px]"
                    />
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-base mb-1 overflow-hidden text-ellipsis whitespace-nowrap">{listing.title}</h3>
                      <p className="text-sm text-airbnb-gray mb-2">{listing.city}, {listing.country}</p>
                      <div className="flex gap-3 text-sm mb-3">
                        <span>₹{listing.price_per_night.toLocaleString('en-IN')}/night</span>
                        {listing.rating_avg > 0 && (
                          <span className="flex items-center gap-1"><IoStar size={12} /> {listing.rating_avg.toFixed(1)} ({listing.review_count})</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="px-3.5 py-1.5 border border-airbnb-dark rounded-sm text-[13px] font-semibold transition-colors duration-fast hover:bg-airbnb-bg-secondary"
                        >
                          View
                        </Link>
                        <button className={`${ICON_BTN} hover:border-airbnb-dark`} onClick={() => toast('Edit feature coming soon')} aria-label="Edit listing">
                          <IoPencil size={16} />
                        </button>
                        <button
                          className={`${ICON_BTN} hover:border-airbnb-error hover:text-airbnb-error`}
                          onClick={() => handleDelete(listing.id)}
                          aria-label="Delete listing"
                        >
                          <IoTrash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="max-[768px]:overflow-x-auto">
              {bookings.length === 0 ? (
                <div className="text-center py-[60px] px-5">
                  <h2 className="mb-2">No bookings yet</h2>
                  <p className="text-airbnb-gray mb-6">Your listings haven&apos;t received any bookings yet.</p>
                </div>
              ) : (
                <table className="w-full border-collapse max-[900px]:text-xs">
                  <thead>
                    <tr>
                      <th className={TH}>Guest</th>
                      <th className={TH}>Listing</th>
                      <th className={TH}>Check-in</th>
                      <th className={TH}>Check-out</th>
                      <th className={TH}>Guests</th>
                      <th className={TH}>Total</th>
                      <th className={TH}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className={TD}>
                          <div className="flex items-center gap-2">
                            <img src={booking.guest?.avatar_url || 'https://ui-avatars.com/api/?name=Guest'} alt="" className="w-8 h-8 rounded-full object-cover" />
                            <span>{booking.guest?.name || 'Guest'}</span>
                          </div>
                        </td>
                        <td className={TD}>{booking.listing?.title?.substring(0, 30) || 'Listing'}...</td>
                        <td className={TD}>{new Date(booking.check_in).toLocaleDateString()}</td>
                        <td className={TD}>{new Date(booking.check_out).toLocaleDateString()}</td>
                        <td className={TD}>{booking.guests}</td>
                        <td className={TD}>₹{booking.total_price.toLocaleString('en-IN')}</td>
                        <td className={TD}>
                          <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${STATUS_STYLES[booking.status] || ''}`}>{booking.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
