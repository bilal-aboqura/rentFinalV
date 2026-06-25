'use client';

import React, { useState, useEffect } from 'react';
import { Location } from '@/types';
import { getRoutePriceAction } from '@/app/admin/pricing/actions';
import { validateBookingScheduleAction } from '@/app/actions/booking';
import { groupLocationsByType, LOCATION_GROUP_ORDER } from '@/lib/utils/groupLocations';
import { MapPin, Navigation, DollarSign, Calendar, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export interface BookingWizardStep1Props {
  locations: Location[];
  loadingLocations: boolean;
  initialData?: {
    pickupId: string;
    destinationId: string;
    date: string;
    time: string;
    price: number | null;
  };
  onNext: (data: {
    pickupId: string;
    destinationId: string;
    date: string;
    time: string;
    price: number;
  }) => void;
}

export default function BookingWizardStep1({
  locations,
  loadingLocations,
  initialData,
  onNext,
}: BookingWizardStep1Props) {
  const [pickupId, setPickupId] = useState(initialData?.pickupId || '');
  const [destinationId, setDestinationId] = useState(initialData?.destinationId || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [time, setTime] = useState(initialData?.time || '');

  const [price, setPrice] = useState<number | null>(initialData?.price || null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [validatingSchedule, setValidatingSchedule] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [routeError, setRouteError] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  // Get current date string for client-side date picker minimum attribute (YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Run validation on location inputs
  useEffect(() => {
    if (pickupId && destinationId && pickupId === destinationId) {
      setRouteError('Pickup and destination locations must be different.');
      setPrice(null);
    } else {
      setRouteError('');
    }
  }, [pickupId, destinationId]);

  // Reset price and errors on route change
  useEffect(() => {
    if (pickupId && destinationId && pickupId !== destinationId) {
      let cancelled = false;

      const fetchPrice = async () => {
        setLoadingPrice(true);
        setErrorMessage('');
        try {
          const res = await getRoutePriceAction(pickupId, destinationId);
          if (cancelled) return;
          if (res.success) {
            setPrice(res.price ?? null);
          } else {
            setPrice(null);
            setErrorMessage(res.error || 'Failed to fetch route price.');
          }
        } catch (err: any) {
          if (cancelled) return;
          setPrice(null);
          setErrorMessage('An error occurred while fetching route price.');
        } finally {
          if (!cancelled) setLoadingPrice(false);
        }
      };

      fetchPrice();
      return () => {
        cancelled = true;
      };
    } else {
      setPrice(null);
    }
  }, [pickupId, destinationId]);

  // Validate buffer when date and time change
  useEffect(() => {
    setScheduleError('');
  }, [date, time]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setScheduleError('');

    if (!pickupId || !destinationId || !date || !time) {
      setErrorMessage('Please fill in all fields before proceeding.');
      return;
    }

    if (pickupId === destinationId) {
      setRouteError('Pickup and destination locations must be different.');
      return;
    }

    if (price === null) {
      setErrorMessage('Please select a valid route with an online price quote.');
      return;
    }

    setValidatingSchedule(true);
    try {
      // Validate the lead time buffer on the server
      const res = await validateBookingScheduleAction(date, time);
      if (!res.success) {
        const validationErrors = res.validationErrors as Record<string, string[]> | undefined;
        const errorMsg = validationErrors?.time?.[0] || res.error || 'Invalid booking schedule.';
        setScheduleError(errorMsg);
        setValidatingSchedule(false);
        return;
      }

      // Procede to Step 2
      onNext({
        pickupId,
        destinationId,
        date,
        time,
        price,
      });
    } catch (err: any) {
      setErrorMessage('Failed to validate booking schedule. Please try again.');
    } finally {
      setValidatingSchedule(false);
    }
  };

  const groupedLocations = groupLocationsByType(locations);
  const isFormValid = pickupId && destinationId && pickupId !== destinationId && date && time && price !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-xl text-sm flex items-start gap-2.5 shadow-lg shadow-red-950/20">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup Dropdown */}
        <div className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            Pickup Location
          </label>
          {loadingLocations ? (
            <div className="h-12 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
          ) : (
            <select
              value={pickupId}
              onChange={(e) => setPickupId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm cursor-pointer shadow-inner"
            >
              <option value="">Choose origin...</option>
              {LOCATION_GROUP_ORDER.map((groupName) => {
                const groupItems = groupedLocations[groupName] || [];
                if (groupItems.length === 0) return null;
                return (
                  <optgroup key={groupName} label={groupName} className="bg-slate-950 text-slate-300">
                    {groupItems.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          )}
        </div>

        {/* Destination Dropdown */}
        <div className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-indigo-400" />
            Destination
          </label>
          {loadingLocations ? (
            <div className="h-12 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
          ) : (
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm cursor-pointer shadow-inner"
            >
              <option value="">Choose destination...</option>
              {LOCATION_GROUP_ORDER.map((groupName) => {
                const groupItems = groupedLocations[groupName] || [];
                if (groupItems.length === 0) return null;
                return (
                  <optgroup key={groupName} label={groupName} className="bg-slate-950 text-slate-300">
                    {groupItems.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          )}
        </div>
      </div>

      {routeError && (
        <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 text-amber-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{routeError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            Pickup Date
          </label>
          <input
            type="date"
            value={date}
            min={getTodayString()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all text-sm cursor-pointer shadow-inner scheme-dark"
          />
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pickup Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-600 transition-all text-sm cursor-pointer shadow-inner scheme-dark"
          />
        </div>
      </div>

      {scheduleError && (
        <div className="p-3.5 bg-red-950/20 border border-red-900/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{scheduleError}</span>
        </div>
      )}

      {/* Pricing display section */}
      <div className="pt-6 border-t border-slate-850">
        {loadingPrice && (
          <div className="flex justify-center items-center py-6 text-slate-400 text-sm gap-2">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span>Calculating trip fare...</span>
          </div>
        )}

        {!loadingPrice && pickupId && destinationId && pickupId !== destinationId && price === null && (
          <div className="p-5 bg-slate-950/50 border border-slate-850 rounded-2xl text-center space-y-3">
            <p className="text-slate-400 text-sm">
              Online pricing is unavailable for this specific route.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-xs font-bold bg-slate-800 hover:bg-slate-750 hover:text-white text-slate-200 px-5 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-700 shadow-md shadow-slate-950/40"
            >
              <span>Go to Contact Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {!loadingPrice && price !== null && (
          <div className="bg-gradient-to-br from-blue-950/20 via-indigo-950/15 to-slate-950/40 border border-blue-900/35 p-6 rounded-2xl text-center relative overflow-hidden shadow-lg shadow-blue-950/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/10">
              Direct Route Pricing
            </span>
            <div className="flex items-center justify-center text-white mt-3 font-black text-4xl tracking-tight">
              <DollarSign className="w-7 h-7 text-blue-500 -mr-1 shrink-0" />
              <span>{price.toFixed(2)}</span>
            </div>
            <p className="text-slate-500 text-xs mt-2.5">
              Flat-rate price including all tolls and airport surcharges.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2">
        {price !== null && (
          <button
            type="submit"
            disabled={!isFormValid || validatingSchedule}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-4 font-bold shadow-xl shadow-blue-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
          >
            {validatingSchedule ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Schedule...</span>
              </>
            ) : (
              <>
                <span>Continue to Trip Details</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
