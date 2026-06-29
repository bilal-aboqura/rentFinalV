/**
 * T019 [US5] - Customer-facing Booking Wizard with grouped active location dropdowns.
 * Groups active locations by type: Cities, Airports, Pickup Points.
 * Uses <optgroup> for semantic grouping.
 */
'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { GroupedLocations } from '@/lib/utils/groupLocations';
import type { LocationRow } from '@/lib/validation/location';

interface GroupedLocationSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  groupedLocations: GroupedLocations;
  excludeId?: string;
  placeholder?: string;
}

/**
 * A <select> element that renders active locations grouped by type with <optgroup>.
 */
export function GroupedLocationSelect({
  id,
  label,
  value,
  onChange,
  groupedLocations,
  excludeId,
  placeholder = 'Select a location...',
}: GroupedLocationSelectProps) {
  const GROUP_LABELS: { key: keyof GroupedLocations; label: string }[] = [
    { key: 'City', label: 'Cities' },
    { key: 'Airport', label: 'Airports' },
    { key: 'Pickup Point', label: 'Pickup Points' },
  ];

  const filterExcluded = (locations: LocationRow[]) =>
    excludeId ? locations.filter((l) => l.id !== excludeId) : locations;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {label}
        </span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {GROUP_LABELS.map(({ key, label: groupLabel }) => {
          const options = filterExcluded(groupedLocations[key]);
          if (options.length === 0) return null;
          return (
            <optgroup key={key} label={groupLabel}>
              {options.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}

// ----------------------------------------------------------------
// Booking Wizard Preview component (standalone demo for US5)
// ----------------------------------------------------------------
interface BookingWizardProps {
  groupedLocations: GroupedLocations;
}

type PriceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; price: number }
  | { status: 'not_found' }
  | { status: 'error' };

export function BookingWizard({ groupedLocations }: BookingWizardProps) {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [priceState, setPriceState] = useState<PriceState>({ status: 'idle' });

  // Fetch price whenever both locations are selected
  const handlePickupChange = (value: string) => {
    setPickup(value);
    setPriceState({ status: 'idle' });
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setPriceState({ status: 'idle' });
  };

  const fetchPrice = async () => {
    if (!pickup || !destination) return;
    setPriceState({ status: 'loading' });
    try {
      const { getRoutePriceAction } = await import('@/app/admin/pricing/actions');
      const result = await getRoutePriceAction(pickup, destination);
      if (result.success && result.data) {
        setPriceState({ status: 'found', price: result.data.price });
      } else {
        setPriceState({ status: 'not_found' });
      }
    } catch {
      setPriceState({ status: 'error' });
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 space-y-4" id="booking-wizard">
      <h2 className="text-lg font-semibold text-white">Book Your Transfer</h2>

      <GroupedLocationSelect
        id="pickup-location"
        label="Pickup Location"
        value={pickup}
        onChange={handlePickupChange}
        groupedLocations={groupedLocations}
        excludeId={destination}
        placeholder="Select pickup location..."
      />

      <GroupedLocationSelect
        id="destination-location"
        label="Destination"
        value={destination}
        onChange={handleDestinationChange}
        groupedLocations={groupedLocations}
        excludeId={pickup}
        placeholder="Select destination..."
      />

      {/* Check Price button */}
      {pickup && destination && priceState.status === 'idle' && (
        <button
          id="check-route-price-btn"
          onClick={fetchPrice}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
        >
          Check Route Price
        </button>
      )}

      {/* Loading */}
      {priceState.status === 'loading' && (
        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10" id="price-loading">
          <p className="text-slate-400 text-sm animate-pulse">Looking up route price…</p>
        </div>
      )}

      {/* Price found */}
      {priceState.status === 'found' && (
        <div
          className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
          id="price-found"
        >
          <p className="text-slate-400 text-xs mb-1">Estimated flat-rate price</p>
          <p className="text-2xl font-bold text-green-400" id="route-price-display">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              priceState.price
            )}
          </p>
          <p className="text-slate-500 text-xs mt-1">Continue to select date and time.</p>
        </div>
      )}

      {/* No price configured */}
      {priceState.status === 'not_found' && (
        <div
          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
          id="price-not-found"
        >
          <p className="text-amber-300 text-sm">
            Online pricing is not available for this route. Please{' '}
            <a href="/contact" className="underline hover:text-amber-200">
              contact us
            </a>{' '}
            for a custom quote.
          </p>
        </div>
      )}

      {/* Error */}
      {priceState.status === 'error' && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20" id="price-error">
          <p className="text-red-300 text-sm">
            Unable to retrieve pricing. Please try again or contact support.
          </p>
        </div>
      )}
    </div>
  );
}
