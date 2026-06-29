'use client';

/**
 * T006 / T007 / T008 / T010 / T011 / T012 / T015 / T016
 * Booking Wizard — Step 1: Route & Time Selection
 *
 * User Stories:
 *   US1 — Route Selection and Validation (P1 MVP)
 *   US2 — Dynamic Pricing Lookup (P2)
 *   US3 — Schedule and Buffer Selection (P3)
 *
 * Spec: specs/005-booking-wizard-step1/spec.md
 * Plan: specs/005-booking-wizard-step1/plan.md
 */

import { useState, useEffect, useTransition } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { getCustomerLocations } from '@/lib/api/customerLocations';
import { checkRoutePriceAction, validateBookingScheduleAction } from '@/app/actions/booking';
import type { GroupedLocations } from '@/lib/utils/groupLocations';
import type { LocationRow } from '@/lib/validation/location';
import type { BookingStep1Input } from '@/lib/validation/booking';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface BookingStep1State {
  pickupLocationId: string;
  destinationLocationId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  price: number | null;
}

interface BookingWizardStep1Props {
  /** Called when the user successfully completes Step 1 */
  onNext: (state: BookingStep1State) => void;
}

type PriceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; price: number }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const GROUP_LABELS: { key: keyof GroupedLocations; label: string }[] = [
  { key: 'City', label: 'Cities' },
  { key: 'Airport', label: 'Airports' },
  { key: 'Pickup Point', label: 'Pickup Points' },
];

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Filter out a specific location from a list */
function filterExcluded(locations: LocationRow[], excludeId?: string): LocationRow[] {
  return excludeId ? locations.filter((l) => l.id !== excludeId) : locations;
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Grouped Location Select
// ─────────────────────────────────────────────────────────────

interface GroupedLocationSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  groupedLocations: GroupedLocations;
  excludeId?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

function GroupedLocationSelect({
  id,
  label,
  value,
  onChange,
  groupedLocations,
  excludeId,
  placeholder = 'Select a location...',
  error,
  disabled,
}: GroupedLocationSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1.5">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          {label}
        </span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-red-500/60' : 'border-white/10 focus:border-indigo-500'
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {GROUP_LABELS.map(({ key, label: groupLabel }) => {
          const options = filterExcluded(groupedLocations[key], excludeId);
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
      {error && (
        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component: BookingWizardStep1
// ─────────────────────────────────────────────────────────────

export function BookingWizardStep1({ onNext }: BookingWizardStep1Props) {
  // ── State ──
  const [groupedLocations, setGroupedLocations] = useState<GroupedLocations>({
    City: [],
    Airport: [],
    'Pickup Point': [],
  });
  const [locationsLoading, setLocationsLoading] = useState(true);

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [priceState, setPriceState] = useState<PriceState>({ status: 'idle' });
  const [errors, setErrors] = useState<Partial<Record<keyof BookingStep1Input | 'general', string>>>({});
  const [scheduleError, setScheduleError] = useState<string>('');

  const [isPending, startTransition] = useTransition();

  // ── Fetch active locations on mount (T007) ──
  useEffect(() => {
    getCustomerLocations().then((res) => {
      if (res.success) {
        setGroupedLocations(res.data);
      }
      setLocationsLoading(false);
    });
  }, []);

  // ── Dynamic pricing lookup: trigger when both locations are selected & distinct (T010) ──
  useEffect(() => {
    if (!pickup || !destination) {
      setPriceState({ status: 'idle' });
      return;
    }

    // T008: Same-location guard
    if (pickup === destination) {
      setPriceState({ status: 'idle' });
      return;
    }

    setPriceState({ status: 'loading' });
    checkRoutePriceAction(pickup, destination).then((res) => {
      if (!res.success) {
        setPriceState({ status: 'error', message: res.error ?? 'Failed to retrieve pricing.' });
        return;
      }
      if (res.data?.price !== null && res.data?.price !== undefined) {
        setPriceState({ status: 'found', price: res.data.price });
      } else {
        setPriceState({ status: 'not_found' });
      }
    });
  }, [pickup, destination]);

  // ── Same-location validation (T008) ──
  const sameLocationError =
    pickup && destination && pickup === destination
      ? 'Pickup and destination locations must be different.'
      : '';

  // ── Handlers ──
  const handlePickupChange = (value: string) => {
    setPickup(value);
    setErrors((prev) => ({ ...prev, pickupLocationId: '' }));
    setScheduleError('');
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setErrors((prev) => ({ ...prev, destinationLocationId: '' }));
    setScheduleError('');
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    setScheduleError('');
    setErrors((prev) => ({ ...prev, date: '' }));
  };

  const handleTimeChange = (value: string) => {
    setTime(value);
    setScheduleError('');
    setErrors((prev) => ({ ...prev, time: '' }));
  };

  // ── Step 1 Next button submission (T016) ──
  const handleNext = () => {
    const newErrors: typeof errors = {};

    if (!pickup) newErrors.pickupLocationId = 'Please select a pickup location.';
    if (!destination) newErrors.destinationLocationId = 'Please select a destination.';
    if (pickup && destination && pickup === destination) {
      newErrors.destinationLocationId = 'Pickup and destination locations must be different.';
    }
    if (!date) newErrors.date = 'Please select a travel date.';
    if (!time) newErrors.time = 'Please select a travel time.';

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    if (priceState.status === 'not_found' || priceState.status === 'error') {
      // Allow proceeding is blocked — contact link is shown
      return;
    }

    // T016: Validate schedule server-side
    startTransition(async () => {
      const scheduleResult = await validateBookingScheduleAction(date, time);

      if (!scheduleResult.success) {
        const timeError = scheduleResult.validationErrors?.time?.[0];
        setScheduleError(timeError ?? 'Invalid schedule. Please select a future time.');
        return;
      }

      const price = priceState.status === 'found' ? priceState.price : null;
      onNext({ pickupLocationId: pickup, destinationLocationId: destination, date, time, price });
    });
  };

  // ── Derived: is "Next" button enabled? ──
  const canProceed =
    !sameLocationError &&
    pickup &&
    destination &&
    date &&
    time &&
    priceState.status === 'found' &&
    !scheduleError;

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Select your route &amp; travel time</h3>
        <p className="text-sm text-slate-400">Choose your pickup and destination, then pick a date and time.</p>
      </div>

      {/* ── Pickup Location (T006, T007) ── */}
      <GroupedLocationSelect
        id="pickup-location"
        label="Pickup Location"
        value={pickup}
        onChange={handlePickupChange}
        groupedLocations={groupedLocations}
        excludeId={destination}
        placeholder={locationsLoading ? 'Loading locations…' : 'Select pickup location...'}
        error={errors.pickupLocationId}
        disabled={locationsLoading}
      />

      {/* ── Destination (T006, T007, T008) ── */}
      <GroupedLocationSelect
        id="destination-location"
        label="Destination"
        value={destination}
        onChange={handleDestinationChange}
        groupedLocations={groupedLocations}
        excludeId={pickup}
        placeholder={locationsLoading ? 'Loading locations…' : 'Select destination...'}
        error={errors.destinationLocationId || sameLocationError}
        disabled={locationsLoading}
      />

      {/* ── Same-location warning banner (T008) ── */}
      {sameLocationError && (
        <div
          id="same-location-warning"
          className="flex items-center gap-2 text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {sameLocationError}
        </div>
      )}

      {/* ── Price Feedback (T010, T011, T012) ── */}
      {priceState.status === 'loading' && (
        <div
          id="price-loading"
          className="flex items-center gap-2 text-slate-400 text-sm p-3 rounded-xl bg-slate-800/50 border border-white/10"
        >
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          Looking up route price…
        </div>
      )}

      {priceState.status === 'found' && (
        <div
          id="price-found"
          className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
        >
          <p className="text-slate-400 text-xs mb-1">Estimated flat-rate price</p>
          <p className="text-2xl font-bold text-green-400" id="route-price-display">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              priceState.price
            )}
          </p>
          <p className="text-slate-500 text-xs mt-1">Continue below to select date and time.</p>
        </div>
      )}

      {/* ── No Price: contact redirect (T012) ── */}
      {priceState.status === 'not_found' && (
        <div
          id="price-not-found"
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
          role="alert"
        >
          <p className="text-amber-300 text-sm font-medium mb-1">
            Online pricing unavailable for this route.
          </p>
          <p className="text-amber-200/70 text-xs">
            Online pricing is unavailable for this specific route. Please use our{' '}
            <a
              id="contact-form-link"
              href="/contact"
              className="underline hover:text-amber-200 font-medium"
            >
              Contact Form
            </a>{' '}
            for a custom quote.
          </p>
          <div className="mt-3">
            <a
              href="/contact"
              id="contact-redirect-btn"
              className="inline-flex items-center gap-2 text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-lg transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              Go to Contact Form
            </a>
          </div>
        </div>
      )}

      {priceState.status === 'error' && (
        <div
          id="price-error"
          className="flex items-center gap-2 text-red-300 text-sm p-3 rounded-xl bg-red-500/10 border border-red-500/20"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {priceState.message}
        </div>
      )}

      {/* ── Date Input (T015) ── */}
      <div>
        <label htmlFor="booking-date" className="block text-sm font-medium text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Travel Date
          </span>
        </label>
        <input
          id="booking-date"
          type="date"
          min={getTodayDateString()}
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm ${
            errors.date ? 'border-red-500/60' : 'border-white/10 focus:border-indigo-500'
          }`}
        />
        {errors.date && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.date}
          </p>
        )}
      </div>

      {/* ── Time Input (T015) ── */}
      <div>
        <label htmlFor="booking-time" className="block text-sm font-medium text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Travel Time
          </span>
        </label>
        <input
          id="booking-time"
          type="time"
          value={time}
          onChange={(e) => handleTimeChange(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm ${
            errors.time || scheduleError
              ? 'border-red-500/60'
              : 'border-white/10 focus:border-indigo-500'
          }`}
        />
        {(errors.time || scheduleError) && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1" id="schedule-error" role="alert">
            <AlertCircle className="w-3 h-3" />
            {scheduleError || errors.time}
          </p>
        )}
      </div>

      {/* ── Next Button (T016) ── */}
      <button
        id="step1-next-btn"
        onClick={handleNext}
        disabled={isPending || !canProceed}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Validating…
          </>
        ) : (
          <>
            Next <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
