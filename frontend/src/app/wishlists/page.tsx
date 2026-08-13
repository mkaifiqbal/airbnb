'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { getWishlists } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Listing } from '@/types';
import toast from 'react-hot-toast';

export default function WishlistsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlists = async () => {
    try {
      const data = await getWishlists();
      setListings(data);
    } catch {
      toast.error('Failed to load wishlists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) { router.push('/'); return; }
    fetchWishlists();
  }, [isAuthLoading, isAuthenticated, router]);

  if (isLoading) {
    return <><Navbar /><div className="page-loading"><div className="spinner spinner-lg" /></div></>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-6 px-0 pb-16">
        <div className="container">
          <h1 className="text-3xl mb-8">Wishlists</h1>

          {listings.length === 0 ? (
            <div className="text-center py-20 px-5">
              <h2 className="mb-2">No saved listings yet</h2>
              <p className="text-airbnb-gray mb-6 max-w-[400px] mx-auto">Start exploring and save your favourite places by clicking the ❤️ icon.</p>
              <button className="btn btn-primary btn-pill" onClick={() => router.push('/')}>Start exploring</button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6 max-[1400px]:grid-cols-3 max-[1000px]:grid-cols-2 max-[550px]:grid-cols-1">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={{ ...listing, is_wishlisted: true }}
                  onWishlistChange={fetchWishlists}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
