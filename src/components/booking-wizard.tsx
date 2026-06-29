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

export function BookingWizard({ groupedLocations }: BookingWizardProps) {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 space-y-4" id="booking-wizard">
      <h2 className="text-lg font-semibold text-white">Book Your Transfer</h2>

      <GroupedLocationSelect
        id="pickup-location"
        label="Pickup Location"
        value={pickup}
        onChange={setPickup}
        groupedLocations={groupedLocations}
        excludeId={destination}
        placeholder="Select pickup location..."
      />

      <GroupedLocationSelect
        id="destination-location"
        label="Destination"
        value={destination}
        onChange={setDestination}
        groupedLocations={groupedLocations}
        excludeId={pickup}
        placeholder="Select destination..."
      />

      {pickup && destination && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-indigo-300 text-sm">Route selected. Continue to choose your vehicle and date.</p>
        </div>
      )}
    </div>
  );
}
