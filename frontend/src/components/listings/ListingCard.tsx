'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Listing } from '@/types';
import { toggleWishlist } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { IoChevronBack, IoChevronForward, IoStar } from 'react-icons/io5';
import toast from 'react-hot-toast';

interface ListingCardProps {
  listing: Listing;
  onWishlistChange?: () => void;
  searchQuery?: string;
}

/** Carousel arrow: hidden until the card is hovered, matching the old CSS module. */
const NAV_BTN =
  'absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 border-none cursor-pointer flex items-center justify-center opacity-0 transition-opacity duration-fast z-[2] shadow-[0_1px_3px_rgba(0,0,0,0.2)] group-hover:opacity-100 hover:bg-white hover:scale-105';

export default function ListingCard({ listing, onWishlistChange, searchQuery = '' }: ListingCardProps) {
  const { isAuthenticated } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(listing.is_wishlisted);
  const [isAnimating, setIsAnimating] = useState(false);

  const images = listing.images.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop'];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to save to wishlist');
      return;
    }

    setIsAnimating(true);
    try {
      await toggleWishlist(listing.id);
      setWishlisted(!wishlisted);
      toast.success(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist ❤️');
      onWishlistChange?.();
    } catch (error: any) {
      toast.error(error.message);
    }
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Link href={`/listings/${listing.id}${searchQuery}`} className="group block no-underline text-inherit">
      {/* Image Carousel */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3">
        <img
          src={images[currentImage]}
          alt={listing.title}
          className={`w-full h-full object-cover transition-transform duration-slow group-hover:scale-[1.03] ${
            listing.is_available === false ? 'saturate-[0.65] brightness-[0.8]' : ''
          }`}
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          className={`absolute top-3 right-3 bg-transparent border-none cursor-pointer z-[2] [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.3))] transition-transform duration-fast hover:scale-110 ${
            isAnimating ? 'animate-heartBounce' : ''
          }`}
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          {wishlisted ? (
            <AiFillHeart size={24} color="#FF385C" />
          ) : (
            <AiOutlineHeart size={24} color="white" />
          )}
        </button>

        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <button
              className={`${NAV_BTN} left-2`}
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <IoChevronBack size={16} />
            </button>
            <button
              className={`${NAV_BTN} right-2`}
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <IoChevronForward size={16} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-[2]">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-fast ${
                    i === currentImage ? 'bg-white' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Guest Favorite Badge */}
        {listing.rating_avg >= 4.9 && (
          <div className="absolute top-3 left-3 bg-white text-airbnb-dark text-xs font-bold px-2.5 py-1 rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.15)] z-[2]">
            Guest favourite
          </div>
        )}
        {listing.is_available === false && (
          <div className="absolute left-3 bottom-3 z-[3] px-[9px] py-1.5 rounded-md bg-[rgba(34,34,34,0.92)] text-white text-xs font-bold">
            Booked for selected dates
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="px-0.5">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-[15px] font-semibold text-airbnb-dark overflow-hidden text-ellipsis whitespace-nowrap flex-1">
            {listing.city}, {listing.country}
          </h3>
          {listing.rating_avg > 0 && (
            <div className="flex items-center gap-1 text-[15px] font-normal text-airbnb-dark shrink-0">
              <IoStar size={14} />
              <span>{listing.rating_avg.toFixed(2)}</span>
            </div>
          )}
        </div>
        <p className="text-[15px] text-airbnb-gray overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">{listing.title}</p>
        <p className="text-[15px] text-airbnb-gray mt-0.5">
          {listing.property_type} · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''} · {listing.beds} bed{listing.beds !== 1 ? 's' : ''}
        </p>
        <p className="mt-1.5 text-[15px] text-airbnb-dark">
          <strong className="font-semibold">₹{listing.price_per_night.toLocaleString('en-IN')}</strong>
          <span className="font-normal"> night</span>
        </p>
      </div>
    </Link>
  );
}
