'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import DatePicker from '@/components/ui/DatePicker';
import GuestPicker from '@/components/ui/GuestPicker';
import LoginModal from '@/components/ui/LoginModal';
import { getListing, getListingReviews, getAvailability, toggleWishlist } from '@/lib/api';
import { holdBooking, createReview } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Listing, Review } from '@/types';
import {
  IoStar, IoShareOutline, IoHeartOutline, IoHeart,
  IoChevronForward, IoChevronBack, IoClose,
  IoWifi, IoCarSport, IoSnow, IoFlame, IoTv, IoWater,
} from 'react-icons/io5';
import {
  MdKitchen, MdPool, MdHotTub, MdFitnessCenter, MdLocalLaundryService,
  MdOutlineBeachAccess, MdOutlineLandscape, MdOutlinePark,
} from 'react-icons/md';
import { GiBarbecue } from 'react-icons/gi';
import toast from 'react-hot-toast';

/* Class recipes for the listing detail page. */
const ACTION_BTN = 'flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold underline transition-colors duration-fast hover:bg-airbnb-bg-secondary';
/** Gallery tiles fade slightly on hover, exactly like the old module. */
const GALLERY_TILE = 'cursor-pointer overflow-hidden [&>img]:w-full [&>img]:h-full [&>img]:object-cover [&>img]:transition-opacity [&>img]:duration-fast hover:[&>img]:opacity-90';
const SECTION_H2 = 'text-xl mb-4';
const PRICE_ROW = 'flex justify-between text-base py-1 [&>span:first-child]:underline [&>span:first-child]:text-airbnb-dark';
const GALLERY_ICON_BTN = 'text-white p-3 rounded-full transition-colors duration-fast shrink-0 hover:bg-white/10';

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi': <IoWifi size={24} />,
  'Kitchen': <MdKitchen size={24} />,
  'Pool': <MdPool size={24} />,
  'Air Conditioning': <IoSnow size={24} />,
  'Parking': <IoCarSport size={24} />,
  'TV': <IoTv size={24} />,
  'Washer': <MdLocalLaundryService size={24} />,
  'Hot Tub': <MdHotTub size={24} />,
  'Fireplace': <IoFlame size={24} />,
  'Gym': <MdFitnessCenter size={24} />,
  'Beach Access': <MdOutlineBeachAccess size={24} />,
  'Mountain View': <MdOutlineLandscape size={24} />,
  'Garden': <MdOutlinePark size={24} />,
  'BBQ Grill': <GiBarbecue size={24} />,
  'Lake View': <IoWater size={24} />,
};

function nextDate(date: string): string {
  if (!date) return todayStr();
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + 1);
  return formatLocalDate(value);
}

/** Format a Date as YYYY-MM-DD using local time (avoids UTC off-by-one). */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr(): string {
  return formatLocalDate(new Date());
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookedRanges, setBookedRanges] = useState<Array<{ check_in: string; check_out: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Booking form state
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests') || '1', 10));

  // Feedback form state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [listingData, reviewData, availData] = await Promise.all([
          getListing(Number(id)),
          getListingReviews(Number(id)),
          getAvailability(Number(id)),
        ]);
        setListing(listingData);
        setWishlisted(listingData.is_wishlisted);
        setReviews(reviewData);
        setBookedRanges(availData.booked_ranges);

        // Clamp a guests value coming from the URL to what the listing allows.
        setGuests((prev) => Math.min(Math.max(1, prev), listingData.max_guests));

        const requestedCheckIn = searchParams.get('checkIn') || '';
        const requestedCheckOut = searchParams.get('checkOut') || '';
        const overlapsBooking = requestedCheckIn && requestedCheckOut && availData.booked_ranges.some(
          (range) => requestedCheckIn < range.check_out && requestedCheckOut > range.check_in
        );
        if (overlapsBooking) {
          setCheckIn('');
          setCheckOut('');
          toast.error('Those dates are already booked. Please choose another range.');
        }
      } catch (error) {
        toast.error('Failed to load listing');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, searchParams]);

  const rangeOverlapsBooking = (start: string, end: string) => (
    bookedRanges.some((range) => start < range.check_out && end > range.check_in)
  );

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save to wishlist');
      return;
    }
    try {
      await toggleWishlist(Number(id));
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist ❤️');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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

  const handleReserve = async () => {
    // Auth is restored from localStorage in an effect, so don't judge too early.
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      toast.error('Please log in to book');
      setShowLoginModal(true);
      return;
    }
    if (!listing) return;
    if (listing.host_id === user?.id) {
      toast.error('You cannot book your own listing');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (checkOut <= checkIn) {
      toast.error('Check-out must be after check-in');
      return;
    }
    if (checkIn < todayStr()) {
      toast.error('Check-in cannot be in the past');
      return;
    }
    if (guests > listing.max_guests) {
      toast.error(`This place allows a maximum of ${listing.max_guests} guest${listing.max_guests !== 1 ? 's' : ''}`);
      return;
    }
    if (rangeOverlapsBooking(checkIn, checkOut)) {
      toast.error('Part of this date range is already booked');
      return;
    }

    setIsHolding(true);
    try {
      const pendingBooking = await holdBooking({
        listing_id: Number(id),
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });
      const bookingParams = new URLSearchParams({
        bookingId: String(pendingBooking.id),
        checkIn,
        checkOut,
        guests: String(guests),
      });
      router.push(`/book/${id}?${bookingParams.toString()}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reserve dates. They might be unavailable.');
      // Refresh availability so newly-booked dates get blocked in the calendar.
      try {
        const avail = await getAvailability(Number(id));
        setBookedRanges(avail.booked_ranges);
      } catch {
        /* keep the previous availability if the refresh fails */
      }
      setIsHolding(false);
      return;
    }
    // Keep the button disabled while the router navigates away.
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to leave feedback');
      return;
    }
    if (feedbackComment.trim().length < 5) {
      toast.error('Feedback must be at least 5 characters');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await createReview({
        listing_id: Number(id),
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      });
      toast.success('Feedback submitted!');
      setFeedbackComment('');
      const [updatedReviews, updatedListing] = await Promise.all([
        getListingReviews(Number(id)),
        getListing(Number(id)),
      ]);
      setReviews(updatedReviews);
      setListing(updatedListing);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const priceCalc = calculatePrice();

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="page-loading"><div className="spinner spinner-lg" /></div>
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Navbar />
        <div className="text-center py-20 px-5">
          <h2>Listing not found</h2>
          <button className="btn btn-primary btn-pill" onClick={() => router.push('/')}>
            Back to Home
          </button>
        </div>
      </>
    );
  }

  const images = listing.images.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop'];

  return (
    <>
      <Navbar />

      <main className="pt-6 px-0 pb-16">
        <div className="container">
          {/* Title Section */}
          <div className="flex justify-between items-start mb-4 max-[768px]:flex-col max-[768px]:gap-2">
            <h1 className="text-2xl font-semibold">{listing.title}</h1>
            <div className="flex gap-2 shrink-0">
              <button className={ACTION_BTN} onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
                <IoShareOutline size={16} />
                <span>Share</span>
              </button>
              <button className={ACTION_BTN} onClick={handleWishlist}>
                {wishlisted ? <IoHeart size={16} color="#FF385C" /> : <IoHeartOutline size={16} />}
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Photo Gallery — Desktop: 5-tile mosaic | Mobile: scrollable strip + button */}
          {/* Desktop mosaic */}
          <div className="relative grid grid-cols-2 gap-2 rounded-md overflow-hidden mb-4 max-h-[420px] max-[1000px]:max-h-[300px] max-[768px]:hidden">
            <div className={GALLERY_TILE} onClick={() => { setGalleryIndex(0); setShowGallery(true); }}>
              <img src={images[0]} alt={listing.title} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {images.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  className={GALLERY_TILE}
                  onClick={() => { setGalleryIndex(i + 1); setShowGallery(true); }}
                >
                  <img src={img} alt={`${listing.title} ${i + 2}`} />
                </div>
              ))}
            </div>
            <button
              className="absolute bottom-4 right-4 px-4 py-[7px] bg-white border border-airbnb-dark rounded-sm text-sm font-semibold cursor-pointer transition-colors duration-fast hover:bg-airbnb-bg-secondary"
              onClick={() => { setGalleryIndex(0); setShowGallery(true); }}
            >
              Show all photos
            </button>
          </div>

          {/* Mobile scrollable photo strip */}
          <div className="hidden max-[768px]:block relative -mx-4 mb-6">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-full aspect-[4/3] relative cursor-pointer snap-center"
                  onClick={() => { setGalleryIndex(i); setShowGallery(true); }}
                >
                  <img src={img} alt={`${listing.title} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {/* Floating indicator */}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-sm pointer-events-none">
              {images.length} Photos
            </div>
          </div>

          {/* Content Layout */}
          <div className="grid grid-cols-[1fr_380px] gap-[72px] max-[1000px]:grid-cols-1 max-[1000px]:gap-8">
            {/* Left Column - Details */}
            <div className="min-w-0">
              {/* Location & Host */}
              <div className="flex justify-between items-start py-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    {listing.property_type} in {listing.city}, {listing.country}
                  </h2>
                  <p className="text-base text-airbnb-dark mb-2">
                    {listing.max_guests} guest{listing.max_guests !== 1 ? 's' : ''} · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''} · {listing.beds} bed{listing.beds !== 1 ? 's' : ''} · {listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}
                  </p>
                  {listing.rating_avg > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <IoStar size={14} />
                      <span className="font-semibold">{listing.rating_avg.toFixed(2)}</span>
                      <span className="text-airbnb-gray underline">· {listing.review_count} review{listing.review_count !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                {listing.host && (
                  <div className="relative shrink-0">
                    <img
                      src={listing.host.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.host.name || 'Host')}&background=FF385C&color=fff`}
                      alt={listing.host.name}
                      className="w-14 h-14 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.host?.name || 'Host')}&background=FF385C&color=fff&size=150`;
                      }}
                    />
                    {listing.host.is_superhost && <span className="absolute bottom-0 right-0 w-[18px] h-[18px] bg-airbnb-pink rounded-full border-2 border-white" />}
                  </div>
                )}
              </div>

              <div className="divider" />

              {/* Host Info */}
              {listing.host && (
                <>
                  <div className="py-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={listing.host.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.host.name || 'Host')}&background=FF385C&color=fff`}
                        alt={listing.host.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.host?.name || 'Host')}&background=FF385C&color=fff&size=150`;
                        }}
                      />
                      <div>
                        <h3 className="text-base font-semibold mb-0.5">Hosted by {listing.host.name}</h3>
                        {listing.host.is_superhost && (
                          <span className="text-sm text-airbnb-gray">⭐ Superhost</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="divider" />
                </>
              )}

              {/* Description */}
              <div className="py-6">
                <p className={`text-base leading-relaxed whitespace-pre-line ${showFullDesc ? '' : 'line-clamp-4'}`}>
                  {listing.description}
                </p>
                {listing.description.length > 300 && (
                  <button
                    className="flex items-center gap-1 mt-3 text-base font-semibold underline cursor-pointer"
                    onClick={() => setShowFullDesc(!showFullDesc)}
                  >
                    {showFullDesc ? 'Show less' : 'Show more'} <IoChevronForward size={14} />
                  </button>
                )}
              </div>

              <div className="divider" />

              {/* Amenities */}
              <div className="py-6">
                <h2 className={SECTION_H2}>What this place offers</h2>
                <div className="grid grid-cols-2 gap-4 max-[768px]:grid-cols-1">
                  {listing.amenities.slice(0, 10).map((amenity) => (
                    <div key={amenity} className="flex items-center gap-4 text-base text-airbnb-dark">
                      {AMENITY_ICONS[amenity] || <span className="w-6 text-center text-2xl text-airbnb-gray">•</span>}
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
                {listing.amenities.length > 10 && (
                  <button className="btn btn-secondary btn-pill mt-4">
                    Show all {listing.amenities.length} amenities
                  </button>
                )}
              </div>

              <div className="divider" />

              {/* Reviews */}
              <div className="mt-8">
                {listing.rating_avg > 0 && (
                  <div className="flex items-center gap-1.5 text-xl font-semibold mb-6">
                    <IoStar size={18} />
                    <span className="font-semibold">{listing.rating_avg.toFixed(2)}</span>
                    <span className="text-airbnb-gray">·</span>
                    <span>{listing.review_count} review{listing.review_count !== 1 ? 's' : ''}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1">
                  {reviews.slice(0, 6).map((review) => (
                    <div key={review.id}>
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={review.user?.avatar_url || 'https://ui-avatars.com/api/?name=User'}
                          alt={review.user?.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <strong className="block text-base">{review.user?.name || 'Guest'}</strong>
                          <span className="text-sm text-airbnb-gray">{new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <IoStar key={i} size={12} color={i < review.rating ? '#FF385C' : '#ddd'} />
                        ))}
                      </div>
                      <p className="text-[15px] leading-normal text-airbnb-dark line-clamp-3">{review.comment}</p>
                    </div>
                  ))}
                </div>

                {isAuthenticated && user?.id !== listing.host_id && (
                  <div className="mt-10 pt-8 border-t border-airbnb-border">
                    <h3 className="text-xl mb-6">Leave Feedback</h3>
                    <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4 max-w-[600px]">
                      <div className="flex gap-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <IoStar
                            key={i}
                            size={24}
                            color={i < feedbackRating ? '#FF385C' : '#ddd'}
                            className="cursor-pointer"
                            onClick={() => setFeedbackRating(i + 1)}
                          />
                        ))}
                      </div>
                      <textarea
                        className="input min-h-[100px] w-full resize-y"
                        placeholder="Share your experience..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary" disabled={isSubmittingFeedback}>
                        {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Booking Widget */}
            <div className="relative">
              <div className="sticky top-[calc(var(--navbar-height)+24px)] border border-airbnb-border rounded-md p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)] max-[1000px]:static">
                <div className="mb-1">
                  <span className="text-xl font-semibold">₹{listing.price_per_night.toLocaleString('en-IN')}</span>
                  <span className="text-base"> night</span>
                </div>

                {listing.rating_avg > 0 && (
                  <div className="flex items-center gap-1 text-sm font-semibold mb-5">
                    <IoStar size={12} />
                    <span>{listing.rating_avg.toFixed(2)}</span>
                    <span className="font-normal text-airbnb-gray underline">· {listing.review_count} reviews</span>
                  </div>
                )}

                <div className="border border-airbnb-border rounded-sm mb-4 relative">
                  <div className="grid grid-cols-2 relative">
                    <div className="px-3 py-2.5 border-r border-airbnb-border relative">
                      <DatePicker
                        label="CHECK-IN"
                        value={checkIn}
                        onChange={setCheckIn}
                        minDate={todayStr()}
                        bookedRanges={bookedRanges}
                        placeholder="Add date"
                        align="left"
                      />
                    </div>
                    <div className="px-3 py-2.5 relative">
                      <DatePicker
                        label="CHECKOUT"
                        value={checkOut}
                        onChange={setCheckOut}
                        minDate={nextDate(checkIn)}
                        bookedRanges={bookedRanges}
                        placeholder="Add date"
                        align="right"
                      />
                    </div>
                  </div>
                  <div className="px-3 py-2.5 border-t border-airbnb-border relative">
                    <GuestPicker
                      // Remount once the listing (and therefore its max) is known,
                      // so the picker's internal counts start within range.
                      key={`guests-${listing.max_guests}`}
                      label="GUESTS"
                      value={guests}
                      onChange={setGuests}
                      maxGuests={listing.max_guests}
                      align="right"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-3.5 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white border-none rounded-sm text-base font-semibold cursor-pointer transition-opacity duration-fast enabled:hover:opacity-90 disabled:opacity-65 disabled:cursor-not-allowed"
                  onClick={handleReserve}
                  disabled={isHolding || isAuthLoading}
                  aria-busy={isHolding}
                >
                  {isHolding ? 'Reserving...' : 'Reserve'}
                </button>

                {priceCalc && (
                  <div className="mt-5">
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
                      <span>Total</span>
                      <span>₹{priceCalc.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Booked Dates Info */}
                {bookedRanges.length > 0 && (
                  <p className="text-[13px] text-airbnb-gray mt-4 text-center">
                    Some dates are unavailable due to existing bookings
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/95 z-[2000] flex flex-col items-center justify-center">
          <button
            className="absolute top-5 left-5 text-white z-10 p-2 rounded-full transition-colors duration-fast hover:bg-white/10"
            onClick={() => setShowGallery(false)}
            aria-label="Close gallery"
          >
            <IoClose size={24} />
          </button>
          <div className="relative w-full h-full max-h-[80vh] max-w-[1200px] flex items-center justify-center px-16 max-[768px]:px-0 mt-8">
            <button
              className={`${GALLERY_ICON_BTN} absolute left-2 max-[768px]:left-1 z-10`}
              onClick={() => setGalleryIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
              aria-label="Previous photo"
            >
              <IoChevronBack size={32} />
            </button>
            <img 
              src={images[galleryIndex]} 
              alt={`Photo ${galleryIndex + 1}`} 
              className="max-w-full max-h-[80vh] object-contain rounded-sm" 
            />
            <button
              className={`${GALLERY_ICON_BTN} absolute right-2 max-[768px]:right-1 z-10`}
              onClick={() => setGalleryIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
              aria-label="Next photo"
            >
              <IoChevronForward size={32} />
            </button>
          </div>
          <div className="text-white text-base mt-4 mb-4">
            {galleryIndex + 1} / {images.length}
          </div>
        </div>
      )}

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </>
  );
}
