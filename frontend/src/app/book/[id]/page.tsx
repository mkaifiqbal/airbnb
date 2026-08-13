'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import { getListing, confirmBooking } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Listing } from '@/types';
import { IoStar, IoChevronBack } from 'react-icons/io5';
import toast from 'react-hot-toast';

/* Class recipes for the checkout page. */
const SECTION_H2 = 'text-xl mb-4';
const TRIP_DETAIL = 'flex justify-between items-start mb-4';
const EDIT_LINK = 'text-sm font-semibold underline cursor-pointer';
const PRICE_ROW = 'flex justify-between text-base py-1';

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = Number(searchParams.get('guests')) || 1;
  const bookingId = Number(searchParams.get('bookingId'));

  useEffect(() => {
    if (!bookingId) {
      toast.error('Invalid booking session');
      router.push(`/listings/${id}`);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Booking hold expired. Please try again.');
          router.push(`/listings/${id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [bookingId, id, router]);

  useEffect(() => {
    // Wait for the persisted session to be restored before redirecting.
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      toast.error('Please log in to book');
      router.push('/');
      return;
    }
    getListing(Number(id))
      .then(setListing)
      .catch(() => toast.error('Failed to load listing'))
      .finally(() => setIsLoading(false));
  }, [id, isAuthLoading, isAuthenticated, router]);

  const calculatePrice = () => {
    if (!listing || !checkIn || !checkOut) return null;
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0) return null;
    const subtotal = listing.price_per_night * nights;
    const total = subtotal + listing.cleaning_fee + listing.service_fee;
    return { nights, subtotal, total };
  };

  const handleConfirmBooking = async () => {
    if (!listing || !bookingId) return;
    setIsBooking(true);
    try {
      await confirmBooking(bookingId);
      setIsConfirmed(true);
      toast.success('🎉 Booking confirmed!');
    } catch (error: any) {
      toast.error(error.message || 'Booking failed');
    } finally {
      setIsBooking(false);
    }
  };

  const priceCalc = calculatePrice();

  if (isLoading) {
    return (
      <><Navbar /><div className="page-loading"><div className="spinner spinner-lg" /></div></>
    );
  }

  if (isConfirmed && listing) {
    return (
      <>
        <Navbar />
        <div className="text-center py-20 px-5 max-w-[560px] mx-auto">
          <div className="text-[64px] mb-4">🎉</div>
          <h1 className="text-[28px] mb-2">Booking Confirmed!</h1>
          <p className="text-base text-airbnb-gray mb-8">Your reservation at <strong>{listing.title}</strong> is confirmed.</p>
          <div className="grid grid-cols-2 gap-4 text-left p-6 bg-airbnb-bg-secondary rounded-md mb-8">
            <div><span className="block text-[13px] text-airbnb-gray">Check-in</span><strong className="block text-base mt-1">{new Date(checkIn).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong></div>
            <div><span className="block text-[13px] text-airbnb-gray">Check-out</span><strong className="block text-base mt-1">{new Date(checkOut).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong></div>
            <div><span className="block text-[13px] text-airbnb-gray">Guests</span><strong className="block text-base mt-1">{guests}</strong></div>
            <div><span className="block text-[13px] text-airbnb-gray">Total</span><strong className="block text-base mt-1">₹{priceCalc?.total.toLocaleString('en-IN')}</strong></div>
          </div>
          <div className="flex gap-3 justify-center">
            <button className="btn btn-primary btn-pill" onClick={() => router.push('/trips')}>View My Trips</button>
            <button className="btn btn-secondary btn-pill" onClick={() => router.push('/')}>Continue Exploring</button>
          </div>
        </div>
      </>
    );
  }

  if (!listing) return null;

  return (
    <>
      <Navbar />
      <main className="pt-6 px-0 pb-16">
        <div className="container">
          <button className="flex items-center gap-2 text-2xl font-semibold mb-8 py-2" onClick={() => router.back()}>
            <IoChevronBack size={20} />
            <span>Confirm and pay</span>
          </button>

          <div className="grid grid-cols-[1fr_400px] gap-12 max-[900px]:grid-cols-1">
            {/* Left - Trip Details & Payment */}
            <div>
              <section className="py-2">
                <h2 className={SECTION_H2}>Your trip</h2>
                <div className={TRIP_DETAIL}>
                  <div>
                    <strong className="block text-base mb-0.5">Dates</strong>
                    <p className="text-sm text-airbnb-gray">{new Date(checkIn).toLocaleDateString()} – {new Date(checkOut).toLocaleDateString()}</p>
                  </div>
                  <button className={EDIT_LINK}>Edit</button>
                </div>
                <div className={TRIP_DETAIL}>
                  <div>
                    <strong className="block text-base mb-0.5">Guests</strong>
                    <p className="text-sm text-airbnb-gray">{guests} guest{guests !== 1 ? 's' : ''}</p>
                  </div>
                  <button className={EDIT_LINK}>Edit</button>
                </div>
              </section>

              <div className="divider" />

              {/* Mock Payment */}
              <section className="py-2">
                <h2 className={SECTION_H2}>Pay with</h2>
                <div className="border border-airbnb-border rounded-sm p-4">
                  <div className="flex items-center gap-3 text-base font-medium mb-4">
                    <span className="text-2xl">💳</span>
                    <span>Credit or debit card</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <input type="text" placeholder="Card number" className="input" defaultValue="4242 4242 4242 4242" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Expiration" className="input" defaultValue="12/28" />
                      <input type="text" placeholder="CVV" className="input" defaultValue="123" />
                    </div>
                  </div>
                  <p className="mt-3 text-[13px] text-airbnb-gray text-center p-2 bg-airbnb-bg-secondary rounded-sm">🔒 This is a demo — no real payment will be processed</p>
                </div>
              </section>

              <div className="divider" />

                <button
                  className="w-full p-4 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white border-none rounded-sm text-base font-semibold cursor-pointer flex items-center justify-center transition-opacity duration-fast mt-6 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleConfirmBooking}
                  disabled={isBooking || timeLeft <= 0}
                >
                  {isBooking ? 'Confirming...' : `Confirm and pay`}
                </button>
            </div>

            {/* Right Column - Listing Summary */}
            <div className="relative">
              <div className="bg-airbnb-bg border border-airbnb-border rounded-lg p-6 sticky top-[120px] max-[900px]:static">
                <div className="bg-[#FFF8E6] border border-[#FFE082] p-3 rounded-md mb-6 flex items-center justify-between text-sm text-[#B7791F]">
                  <span>⏱️ Complete booking in: </span>
                  <strong>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </strong>
                </div>
                <div className="flex gap-4 mb-2">
                  <img
                    src={listing.images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=150&fit=crop'}
                    alt={listing.title}
                    className="w-[124px] h-[100px] object-cover rounded-sm shrink-0"
                  />
                  <div>
                    <p className="text-xs text-airbnb-gray">{listing.property_type}</p>
                    <h3 className="text-sm font-semibold mt-1 line-clamp-2">{listing.title}</h3>
                    {listing.rating_avg > 0 && (
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <IoStar size={12} />
                        <span>{listing.rating_avg.toFixed(2)}</span>
                        <span className="text-airbnb-gray">({listing.review_count})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="divider" />

                <h3 className="text-xl mb-4">Price details</h3>
                {priceCalc && (
                  <>
                    <div className={PRICE_ROW}>
                      <span>₹{listing.price_per_night.toLocaleString('en-IN')} × {priceCalc.nights} night{priceCalc.nights !== 1 ? 's' : ''}</span>
                      <span>₹{priceCalc.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {listing.cleaning_fee > 0 && (
                      <div className={PRICE_ROW}>
                        <span>Cleaning fee</span>
                        <span>₹{listing.cleaning_fee.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {listing.service_fee > 0 && (
                      <div className={PRICE_ROW}>
                        <span>Service fee</span>
                        <span>₹{listing.service_fee.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="divider" />
                    <div className={`${PRICE_ROW} font-semibold`}>
                      <span>Total (INR)</span>
                      <span>₹{priceCalc.total.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
