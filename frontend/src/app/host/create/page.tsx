'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/navbar/Navbar';
import { createListing, uploadImage } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { IoChevronBack, IoChevronForward, IoCloudUpload, IoClose } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { reverseGeocode, roundCoordinate, searchPlaces } from '@/lib/geocode';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false });

const PROPERTY_TYPES = ['House', 'Apartment', 'Villa', 'Cabin', 'Cottage', 'Treehouse', 'Tiny Home', 'Bungalow', 'Chalet', 'Dome'];
const CATEGORIES = ['Beachfront', 'Cabins', 'Trending', 'Lakefront', 'Amazing Pools', 'Countryside', 'Mansions', 'Tiny Homes', 'Treehouses', 'Tropical', 'Skiing', 'Amazing Views', 'Islands', 'Camping'];
const ALL_AMENITIES = ['WiFi', 'Kitchen', 'Pool', 'Air Conditioning', 'Parking', 'TV', 'Washer', 'Dryer', 'Hot Tub', 'Fireplace', 'Gym', 'Beach Access', 'Mountain View', 'Lake View', 'Garden', 'BBQ Grill', 'Heating', 'Coffee Maker', 'Elevator', 'Doorman'];

const STEPS = ['Type', 'Location', 'Details', 'Amenities', 'Photos', 'Pricing', 'Review'];

/* Shared class recipes so repeated controls keep one source of truth. */
const TYPE_CARD = 'border border-airbnb-border rounded-md text-center cursor-pointer transition-all duration-fast hover:border-airbnb-dark';
const TYPE_CARD_ACTIVE = 'border-2 border-airbnb-dark bg-airbnb-bg-secondary';
const COUNTER_BTN = 'w-8 h-8 rounded-full border border-airbnb-border flex items-center justify-center text-lg cursor-pointer bg-airbnb-bg hover:border-airbnb-dark';


export default function CreateListingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [propertyType, setPropertyType] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('');
  // `null` until the address is geocoded, the host clicks the map, or uses their current location.
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [pinLabel, setPinLabel] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  /** True once the pin matches an address we resolved (typed, searched or clicked). */
  const [isPinConfirmed, setIsPinConfirmed] = useState(false);
  const [maxGuests, setMaxGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [pricePerNight, setPricePerNight] = useState(100);
  const [cleaningFee, setCleaningFee] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [uploading, setUploading] = useState(false);

  /** Free-text address built from the four fields — this is what the pin follows. */
  const addressQuery = [address, city, state, country].filter(Boolean).join(', ');
  /** Set before we write into the address fields ourselves, so the pin never chases its own edits. */
  const skipAutoTrack = useRef(false);
  const lastTrackedQuery = useRef('');
  const autoTrackAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !user?.is_host) {
      toast.error('Host access required');
      router.push('/');
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  /**
   * Move the map pin automatically while the host types the address.
   * Debounced because Nominatim allows ~1 request/second. Only the pin changes here —
   * the typed text is never rewritten, so the caret can't jump mid-word.
   */
  useEffect(() => {
    if (step !== 1) return;

    if (skipAutoTrack.current) {
      skipAutoTrack.current = false;
      lastTrackedQuery.current = addressQuery.trim();
      return;
    }

    // A country alone would drop the pin in the middle of the country — wait for a city.
    if (city.trim().length < 2) return;

    const query = addressQuery.trim();
    if (query.length < 3) return;

    // Avoid duplicate searches for the same query
    if (query === lastTrackedQuery.current) return;

    const timer = setTimeout(async () => {
      autoTrackAbort.current?.abort();
      const controller = new AbortController();
      autoTrackAbort.current = controller;
      setIsLocating(true);
      try {
        // Try the full address first; fall back to city/state/country when the
        // street line is too specific for Nominatim to match.
        let [place] = await searchPlaces(query, controller.signal);
        const cityQuery = [city, state, country].filter(Boolean).join(', ').trim();
        if (!place && cityQuery && cityQuery !== query) {
          [place] = await searchPlaces(cityQuery, controller.signal);
        }
        if (!place) return;
        lastTrackedQuery.current = query;
        setLatitude(roundCoordinate(place.latitude));
        setLongitude(roundCoordinate(place.longitude));
        setPinLabel(place.label);
        setIsPinConfirmed(true);
      } catch {
        /* Ignore — the host can still place the pin by clicking the map. */
      } finally {
        setIsLocating(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [addressQuery, city, state, country, step]);

  // Drop any in-flight lookup when leaving the page.
  useEffect(() => () => autoTrackAbort.current?.abort(), []);

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const addImageUrl = () => {
    if (imageUrl.trim() && !images.includes(imageUrl.trim())) {
      setImages((prev) => [...prev, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const result = await uploadImage(file);
        setImages((prev) => [...prev, result.url]);
        toast.success('Image uploaded!');
      } catch (error: any) {
        toast.error(`Upload failed: ${error.message}`);
      }
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Pin moved by clicking the map or by the browser's geolocation.
   * The address fields are refilled from the coordinates via reverse geocoding.
   */
  const updatePin = async (lat: number, lon: number) => {
    const roundedLat = roundCoordinate(lat);
    const roundedLon = roundCoordinate(lon);
    setLatitude(roundedLat);
    setLongitude(roundedLon);
    setPinLabel('');
    setIsPinConfirmed(true);

    setIsLocating(true);
    try {
      const place = await reverseGeocode(roundedLat, roundedLon);
      if (!place) {
        toast.error('No address found here. Fill the city and country manually.');
        return;
      }
      // We are about to edit the address fields ourselves — don't re-run the pin tracker.
      skipAutoTrack.current = true;
      setPinLabel(place.label);
      if (place.address) setAddress(place.address);
      if (place.city) setCity(place.city);
      setState(place.state);
      if (place.country) setCountry(place.country);
    } catch {
      toast.error('Could not read the address for that pin. Fill the fields manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Current location is not supported by this browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        updatePin(coords.latitude, coords.longitude);
      },
      () => {
        toast.error('Location permission was denied');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /**
   * Explicit "Find address on map" — geocodes whatever is typed right now
   * and both moves the pin and normalises the address fields.
   */
  const findAddress = async () => {
    const query = addressQuery.trim();
    if (query.length < 3) {
      toast.error('Type at least a city before searching the map');
      return;
    }

    autoTrackAbort.current?.abort();
    setIsLocating(true);
    try {
      // Same two-step lookup as the automatic tracker: precise line first, city second.
      let [place] = await searchPlaces(query);
      const cityQuery = [city, state, country].filter(Boolean).join(', ').trim();
      if (!place && cityQuery && cityQuery !== query) {
        [place] = await searchPlaces(cityQuery);
      }
      if (!place) {
        toast.error('Address not found. Click the map to place the pin.');
        return;
      }
      skipAutoTrack.current = true;
      lastTrackedQuery.current = query;
      setLatitude(roundCoordinate(place.latitude));
      setLongitude(roundCoordinate(place.longitude));
      setPinLabel(place.label);
      setIsPinConfirmed(true);
      if (place.address) setAddress(place.address);
      if (place.city) setCity(place.city);
      setState(place.state);
      if (place.country) setCountry(place.country);
    } catch {
      toast.error('Address lookup unavailable. Click the map to place the pin.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const listing = await createListing({
        title, description, property_type: propertyType, category,
        price_per_night: pricePerNight, cleaning_fee: cleaningFee, service_fee: serviceFee,
        max_guests: maxGuests, bedrooms, beds, bathrooms,
        address, city, state, country,
        latitude: latitude ?? undefined, longitude: longitude ?? undefined,
        amenities, images,
      });
      toast.success('🎉 Listing created!');
      router.push(`/listings/${listing.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canNext = () => {
    switch (step) {
      case 0: return !!propertyType;
      case 1: return !!city && !!country && latitude != null && longitude != null;
      case 2: return !!title && !!description && title.length >= 3 && description.length >= 10;
      case 3: return true;
      case 4: return images.length > 0;
      case 5: return pricePerNight > 0;
      case 6: return true;
      default: return false;
    }
  };

  /** "12.345678, 76.543210" or a dash while no pin exists. */
  const pinCoordinates = latitude != null && longitude != null
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : '—';

  return (
    <>
      <Navbar />
      <main className="pt-0 px-0 pb-[120px] min-h-screen">
        <div className="max-w-[640px] mx-auto px-6">
          {/* Progress Bar */}
          <div className="h-1 bg-airbnb-border-light rounded-sm mt-4 mb-2 overflow-hidden">
            <div
              className="h-full rounded-sm bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] transition-[width] duration-slow"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mb-8">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`text-[11px] font-semibold ${i <= step ? 'text-airbnb-dark' : 'text-airbnb-gray-light'}`}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[50vh]">
            {step === 0 && (
              <div>
                <h1 className="text-2xl font-semibold mb-6">What type of place will guests have?</h1>
                <div className="grid grid-cols-3 gap-3 max-[768px]:grid-cols-2">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type}
                      className={`${TYPE_CARD} px-4 py-5 text-base font-semibold ${propertyType === type ? TYPE_CARD_ACTIVE : ''}`}
                      onClick={() => setPropertyType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <h2 className="text-lg font-semibold mb-3 mt-8">Category</h2>
                <div className="grid grid-cols-3 gap-3 max-[768px]:grid-cols-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`${TYPE_CARD} p-3 text-sm font-semibold ${category === cat ? TYPE_CARD_ACTIVE : ''}`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h1 className="text-2xl font-semibold mb-6">Where&apos;s your place located?</h1>
                <div className="grid grid-cols-2 gap-4 max-[768px]:grid-cols-1">
                  <div className="input-group"><label>Country</label><input className="input" value={country} onChange={(e) => setCountry(e.target.value)} /></div>
                  <div className="input-group"><label>State / Region</label><input className="input" value={state} onChange={(e) => setState(e.target.value)} /></div>
                  <div className="input-group"><label>City *</label><input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" /></div>
                  <div className="input-group"><label>Street Address</label><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Marine Drive" /></div>
                </div>
                <div className="flex gap-2.5 mt-4 max-[768px]:flex-col">
                  <button type="button" className="btn btn-outline" onClick={findAddress} disabled={isLocating}>
                    {isLocating ? 'Locating...' : 'Find address on map'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={useCurrentLocation} disabled={isLocating}>
                    Use current location
                  </button>
                </div>
                <div className="h-[300px] mt-4 border border-airbnb-border rounded-md overflow-hidden">
                  <LocationPicker latitude={latitude} longitude={longitude} onChange={updatePin} />
                </div>
                <div className="flex justify-between gap-4 mt-2 text-xs text-airbnb-gray max-[768px]:flex-col">
                  <span className={isPinConfirmed ? 'text-[#08783e] font-bold' : ''}>
                    {isPinConfirmed
                      ? `Pin confirmed${pinLabel ? ` · ${pinLabel}` : ''}`
                      : 'Type the address, or click the map to place the pin on the exact entrance'}
                  </span>
                  <span>{pinCoordinates}</span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-2xl font-semibold mb-6">Tell guests about your place</h1>
                <div className="flex flex-col gap-5">
                  <div className="input-group">
                    <label>Title *</label>
                    <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Stunning Villa with Ocean View" maxLength={255} />
                    <span className="block text-xs text-airbnb-gray text-right mt-1">{title.length}/255</span>
                  </div>
                  <div className="input-group">
                    <label>Description *</label>
                    <textarea className="input textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your place, what makes it special, and what guests can expect..." rows={6} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-[768px]:grid-cols-1">
                    {([
                      { label: 'Max guests', value: maxGuests, set: setMaxGuests, min: 1 },
                      { label: 'Bedrooms', value: bedrooms, set: setBedrooms, min: 0 },
                      { label: 'Beds', value: beds, set: setBeds, min: 1 },
                      { label: 'Bathrooms', value: bathrooms, set: setBathrooms, min: 1 },
                    ] as const).map(({ label, value, set, min }) => (
                      <div key={label} className="flex justify-between items-center p-4 border border-airbnb-border-light rounded-sm text-base">
                        <span>{label}</span>
                        <div className="flex items-center gap-4">
                          <button className={COUNTER_BTN} onClick={() => set(Math.max(min, value - 1))} aria-label={`Decrease ${label}`}>−</button>
                          <span className="min-w-6 text-center">{value}</span>
                          <button className={COUNTER_BTN} onClick={() => set(value + 1)} aria-label={`Increase ${label}`}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="text-2xl font-semibold mb-6">What amenities do you offer?</h1>
                <div className="flex flex-wrap gap-2.5">
                  {ALL_AMENITIES.map((a) => (
                    <button
                      key={a}
                      className={`px-[18px] py-2.5 border rounded-pill text-sm cursor-pointer transition-all duration-fast ${
                        amenities.includes(a)
                          ? 'bg-airbnb-dark text-white border-airbnb-dark'
                          : 'bg-airbnb-bg border-airbnb-border hover:border-airbnb-dark'
                      }`}
                      onClick={() => toggleAmenity(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h1 className="text-2xl font-semibold mb-6">Add some photos</h1>
                <div className="mb-4 relative">
                  <input type="file" id="fileUpload" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <label
                    htmlFor="fileUpload"
                    className="flex flex-col items-center justify-center gap-3 p-12 border-2 border-dashed border-airbnb-border rounded-md cursor-pointer transition-all duration-fast text-airbnb-gray text-base hover:border-airbnb-dark hover:text-airbnb-dark"
                  >
                    <IoCloudUpload size={48} />
                    <span>Click to upload or drag images here</span>
                    <span className="text-[13px] text-airbnb-gray-light">Images will be compressed automatically</span>
                  </label>
                  {uploading && (
                    <div className="flex items-center gap-3 justify-center mt-3 text-sm text-airbnb-gray">
                      <div className="spinner" /> Uploading...
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mb-4">
                  <input className="input flex-1" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or paste image URL..." onKeyDown={(e) => e.key === 'Enter' && addImageUrl()} />
                  <button className="btn btn-outline" onClick={addImageUrl}>Add</button>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 max-[768px]:grid-cols-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-sm overflow-hidden">
                        <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                          onClick={() => removeImage(i)}
                          aria-label={`Remove photo ${i + 1}`}
                        >
                          <IoClose size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div>
                <h1 className="text-2xl font-semibold mb-6">Set your price</h1>
                <div className="flex flex-col gap-5">
                  <div className="input-group"><label>Price per night (₹) *</label><input className="input" type="number" value={pricePerNight} onChange={(e) => setPricePerNight(Number(e.target.value))} min={1} /></div>
                  <div className="input-group"><label>Cleaning fee (₹)</label><input className="input" type="number" value={cleaningFee} onChange={(e) => setCleaningFee(Number(e.target.value))} min={0} /></div>
                  <div className="input-group"><label>Service fee (₹)</label><input className="input" type="number" value={serviceFee} onChange={(e) => setServiceFee(Number(e.target.value))} min={0} /></div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h1 className="text-2xl font-semibold mb-6">Review your listing</h1>
                <div className="flex flex-col gap-3">
                  {[
                    ['Type', propertyType],
                    ['Category', category || 'None'],
                    ['Location', `${city}, ${state ? `${state}, ` : ''}${country}`],
                    ['Map pin', pinCoordinates],
                    ['Title', title],
                    ['Guests / Bedrooms / Beds / Baths', `${maxGuests} / ${bedrooms} / ${beds} / ${bathrooms}`],
                    ['Amenities', amenities.join(', ') || 'None'],
                    ['Photos', `${images.length} photo${images.length !== 1 ? 's' : ''}`],
                    ['Price', `₹${pricePerNight}/night + ₹${cleaningFee} cleaning + ₹${serviceFee} service`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-3 border-b border-airbnb-border-light">
                      <span className="text-sm text-airbnb-gray">{label}</span>
                      <strong className="text-sm text-right max-w-[60%]">{value}</strong>
                    </div>
                  ))}
                </div>
                {images.length > 0 && (
                  <div className="flex gap-2 mt-5 overflow-x-auto">
                    {images.slice(0, 5).map((img, i) => (
                      <img key={i} src={img} alt={`Preview ${i + 1}`} className="w-[120px] h-[90px] object-cover rounded-sm shrink-0" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="fixed bottom-0 left-0 right-0 flex justify-between items-center px-6 py-4 bg-airbnb-bg border-t border-airbnb-border-light z-50">
            <button
              className="flex items-center gap-1 text-base font-semibold underline cursor-pointer"
              onClick={() => step > 0 ? setStep(step - 1) : router.back()}
            >
              <IoChevronBack size={16} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary btn-pill" onClick={() => setStep(step + 1)} disabled={!canNext()}>
                Next <IoChevronForward size={16} />
              </button>
            ) : (
              <button className="btn btn-primary btn-pill btn-lg" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <div className="spinner" /> : 'Publish listing 🎉'}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
