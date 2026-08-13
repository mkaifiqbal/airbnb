'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import { getMyTrips, cancelBooking, createReview } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Booking } from '@/types';
import { IoStar, IoClose } from 'react-icons/io5';
import toast from 'react-hot-toast';

/* Class recipes for the trip list. */
const TAB = 'px-1 py-3 text-sm font-semibold border-b-2 transition-all duration-fast';
const TAB_IDLE = 'text-airbnb-gray border-b-transparent hover:text-airbnb-dark';
const TAB_ACTIVE = 'text-airbnb-dark border-b-airbnb-dark';
const UNDERLINE_BTN = 'text-sm font-semibold underline cursor-pointer';
/** Status pill colours mirror the old `.status_*` rules. */
const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-[#E7F9E7] text-[#008A05]',
  cancelled: 'bg-[#FFE8E8] text-[#C13515]',
  completed: 'bg-[#F0F0F0] text-airbnb-gray',
};

export default function TripsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [trips, setTrips] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showReviewModal, setShowReviewModal] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) { router.push('/'); return; }
    getMyTrips()
      .then(setTrips)
      .catch(() => toast.error('Failed to load trips'))
      .finally(() => setIsLoading(false));
  }, [isAuthLoading, isAuthenticated, router]);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = trips.filter((t) => t.check_in >= today && t.status !== 'cancelled');
  const past = trips.filter((t) => t.check_in < today || t.status === 'cancelled');

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(bookingId);
      setTrips((prev) => prev.map((t) => t.id === bookingId ? { ...t, status: 'cancelled' } : t));
      toast.success('Booking cancelled');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReview = async (trip: Booking) => {
    try {
      await createReview({
        listing_id: trip.listing_id,
        booking_id: trip.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review submitted! ⭐');
      setShowReviewModal(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const displayTrips = activeTab === 'upcoming' ? upcoming : past;

  if (isLoading) {
    return <><Navbar /><div className="page-loading"><div className="spinner spinner-lg" /></div></>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-6 px-0 pb-16">
        <div className="container">
          <h1 className="text-3xl mb-6">Trips</h1>

          <div className="flex gap-4 mb-8 border-b border-airbnb-border-light">
            <button className={`${TAB} ${activeTab === 'upcoming' ? TAB_ACTIVE : TAB_IDLE}`} onClick={() => setActiveTab('upcoming')}>
              Upcoming ({upcoming.length})
            </button>
            <button className={`${TAB} ${activeTab === 'past' ? TAB_ACTIVE : TAB_IDLE}`} onClick={() => setActiveTab('past')}>
              Past ({past.length})
            </button>
          </div>

          {displayTrips.length === 0 ? (
            <div className="text-center py-20 px-5">
              <h2 className="mb-2">No {activeTab} trips</h2>
              <p className="text-airbnb-gray mb-6">{activeTab === 'upcoming' ? "Time to start planning your next adventure!" : "You haven't taken any trips yet."}</p>
              <button className="btn btn-primary btn-pill" onClick={() => router.push('/')}>Start exploring</button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {displayTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex gap-5 p-5 border border-airbnb-border-light rounded-md cursor-pointer transition-shadow duration-fast hover:shadow-airbnb-card max-[768px]:flex-col"
                  onClick={() => router.push(`/listings/${trip.listing_id}`)}
                >
                  <img
                    src={trip.listing?.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop'}
                    alt={trip.listing?.title}
                    className="w-[200px] h-[140px] object-cover rounded-sm shrink-0 max-[768px]:w-full max-[768px]:h-[200px]"
                  />
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg mb-1">{trip.listing?.title || 'Listing'}</h3>
                    <p className="text-sm text-airbnb-gray mb-1">{trip.listing?.city}, {trip.listing?.country}</p>
                    <p className="text-sm text-airbnb-gray mb-2">
                      {new Date(trip.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase ${STATUS_STYLES[trip.status] || ''}`}>
                        {trip.status}
                      </span>
                      <span className="text-base font-semibold">₹{trip.total_price.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex gap-3 mt-auto">
                      {trip.status === 'confirmed' && trip.check_in >= today && (
                        <button className={`${UNDERLINE_BTN} text-airbnb-error`} onClick={(e) => { e.stopPropagation(); handleCancel(trip.id); }}>
                          Cancel booking
                        </button>
                      )}
                      {(trip.status === 'completed' || trip.check_out < today) && trip.status !== 'cancelled' && (
                        <button className={`${UNDERLINE_BTN} text-airbnb-dark`} onClick={(e) => { e.stopPropagation(); setShowReviewModal(trip.id); }}>
                          Leave a review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={() => setShowReviewModal(null)}><IoClose size={20} /></button>
              <h2>Leave a review</h2>
              <div className="w-8" />
            </div>
            <div className="modal-body">
              <div className="flex gap-2 justify-center mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="cursor-pointer transition-transform duration-fast hover:scale-125"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <IoStar size={32} color={star <= reviewRating ? '#FF385C' : '#ddd'} />
                  </button>
                ))}
              </div>
              <textarea
                className="input textarea"
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <button
                className="btn btn-primary btn-pill w-full mt-4"
                onClick={() => {
                  const trip = trips.find((t) => t.id === showReviewModal);
                  if (trip) handleReview(trip);
                }}
                disabled={!reviewComment.trim()}
              >
                Submit review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
