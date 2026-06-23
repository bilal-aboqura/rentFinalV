'use client';

import React, { useState, useEffect } from 'react';
import { Location } from '@/types';
import { getRoutePriceAction, getActiveLocationsAction } from '@/app/admin/pricing/actions';
import { MapPin, Navigation, DollarSign, Calculator, PhoneCall } from 'lucide-react';

export default function BookingWizard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [pickupId, setPickupId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Load active locations on mount
  useEffect(() => {
    async function loadLocations() {
      const res = await getActiveLocationsAction();
      if (res.success && res.data) {
        setLocations(res.data);
      } else {
        setErrorMessage('Failed to load available locations. Please try again.');
      }
      setLoadingLocations(false);
    }
    loadLocations();
  }, []);

  // Fetch price quote when both locations are selected
  useEffect(() => {
    if (!pickupId || !destinationId) {
      setPrice(null);
      return;
    }

    if (pickupId === destinationId) {
      setPrice(null);
      return;
    }

    async function getQuote() {
      setLoadingPrice(true);
      const res = await getRoutePriceAction(pickupId, destinationId);
      setLoadingPrice(false);

      if (res.success) {
        setPrice(res.price);
      } else {
        setPrice(null);
        setErrorMessage('Error calculating price. Please contact support.');
      }
    }

    getQuote();
  }, [pickupId, destinationId]);

  // Group locations by type (City, Airport, Pickup Point)
  const groupedLocations = locations.reduce(
    (acc, loc) => {
      const group = loc.type === 'City' ? 'Cities' : loc.type === 'Airport' ? 'Airports' : 'Pickup Points';
      if (!acc[group]) acc[group] = [];
      acc[group].push(loc);
      return acc;
    },
    { Cities: [], Airports: [], 'Pickup Points': [] } as Record<string, Location[]>
  );

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-3">
          <Calculator className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Instant Price Calculator</h2>
        <p className="text-slate-400 text-sm mt-1.5">
          Select your locations to calculate your flat-rate transfer price instantly.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-xl text-sm">
          {errorMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Pickup Dropdown */}
        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            Pickup Location
          </label>
          {loadingLocations ? (
            <div className="h-12 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
          ) : (
            <select
              value={pickupId}
              onChange={e => setPickupId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            >
              <option value="">Choose origin...</option>
              {Object.entries(groupedLocations).map(([groupName, groupItems]) => {
                if (groupItems.length === 0) return null;
                return (
                  <optgroup key={groupName} label={groupName} className="bg-slate-950 text-slate-300">
                    {groupItems.map(loc => (
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-indigo-400" />
            Destination
          </label>
          {loadingLocations ? (
            <div className="h-12 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse" />
          ) : (
            <select
              value={destinationId}
              onChange={e => setDestinationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
            >
              <option value="">Choose destination...</option>
              {Object.entries(groupedLocations).map(([groupName, groupItems]) => {
                if (groupItems.length === 0) return null;
                return (
                  <optgroup key={groupName} label={groupName} className="bg-slate-950 text-slate-300">
                    {groupItems.map(loc => (
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

        {/* Price Display / Messages */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          {loadingPrice && (
            <div className="flex justify-center items-center py-6 text-slate-400 text-sm gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Calculating trip fare...</span>
            </div>
          )}

          {!loadingPrice && pickupId && destinationId && pickupId === destinationId && (
            <div className="p-4 bg-amber-950/20 border border-amber-900/40 text-amber-300 text-sm rounded-xl text-center">
              Pickup and destination must be different locations.
            </div>
          )}

          {!loadingPrice && pickupId && destinationId && pickupId !== destinationId && price === null && (
            <div className="p-5 bg-slate-950/50 border border-slate-850 rounded-2xl text-center space-y-3">
              <p className="text-slate-400 text-sm">
                Online pricing is unavailable for this specific route.
              </p>
              <a
                href="tel:+15550199"
                className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-white px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                <span>Call Support for Quote</span>
              </a>
            </div>
          )}

          {!loadingPrice && price !== null && (
            <div className="bg-gradient-to-br from-blue-950/30 to-indigo-950/20 border border-blue-900/30 p-6 rounded-2xl text-center">
              <span className="text-xs uppercase font-semibold text-blue-400 tracking-wider">
                Direct Route Pricing
              </span>
              <div className="flex items-center justify-center text-white mt-2 font-black text-4xl">
                <DollarSign className="w-7 h-7 text-blue-500 -mr-1" />
                <span>{price.toFixed(2)}</span>
              </div>
              <p className="text-slate-400 text-xs mt-2">
                Flat-rate price including all tolls and airport surcharges.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
