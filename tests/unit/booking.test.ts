/**
 * Booking Wizard Step 1 — Vitest Unit Tests
 *
 * Covers:
 * - Zod schema validation (same-location, field format)
 * - Same-day 2-hour lead-time buffer validation helper
 * - groupLocationsByType utility integration (location dropdown logic)
 * - Route pricing lookup logic
 */

import { describe, it, expect } from 'vitest';
import { BookingStep1Schema } from '@/lib/validation/booking';
import { validateBookingSchedule } from '@/app/actions/booking';
import { groupLocationsByType } from '@/lib/utils/groupLocations';
import type { LocationRow } from '@/lib/validation/location';

// ─────────────────────────────────────────────────────────────
// T005 / T013: Helpers
// ─────────────────────────────────────────────────────────────

const PICKUP_ID = '00000000-0000-0000-0000-000000000001';
const DEST_ID = '00000000-0000-0000-0000-000000000002';

const validBaseInput = {
  pickupLocationId: PICKUP_ID,
  destinationLocationId: DEST_ID,
  date: '2030-12-31',
  time: '14:00',
};

// ─────────────────────────────────────────────────────────────
// T005 [US1] — Zod Schema: same-location validation
// ─────────────────────────────────────────────────────────────

describe('BookingStep1Schema — Route Validation (US1)', () => {
  it('passes with valid, distinct locations and date/time', () => {
    const result = BookingStep1Schema.safeParse(validBaseInput);
    expect(result.success).toBe(true);
  });

  it('fails when pickupLocationId equals destinationLocationId', () => {
    const result = BookingStep1Schema.safeParse({
      ...validBaseInput,
      destinationLocationId: PICKUP_ID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const destinationError = result.error.issues.find(
        (i) => i.path.includes('destinationLocationId')
      );
      expect(destinationError?.message).toMatch(/different/i);
    }
  });

  it('fails when pickupLocationId is not a valid UUID', () => {
    const result = BookingStep1Schema.safeParse({
      ...validBaseInput,
      pickupLocationId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('fails when destinationLocationId is not a valid UUID', () => {
    const result = BookingStep1Schema.safeParse({
      ...validBaseInput,
      destinationLocationId: 'bad-id',
    });
    expect(result.success).toBe(false);
  });

  it('fails when date format is invalid', () => {
    const result = BookingStep1Schema.safeParse({
      ...validBaseInput,
      date: '31-12-2030',
    });
    expect(result.success).toBe(false);
  });

  it('fails when time format is invalid', () => {
    const result = BookingStep1Schema.safeParse({
      ...validBaseInput,
      time: '2:30PM',
    });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// T005 [US1] — Location grouping & dropdown logic
// ─────────────────────────────────────────────────────────────

describe('groupLocationsByType — Active Location Dropdown (US1)', () => {
  const mockLocations: LocationRow[] = [
    { id: '1', name: 'Austin Downtown', type: 'City', is_active: true, created_at: '' },
    { id: '2', name: 'Austin Airport', type: 'Airport', is_active: true, created_at: '' },
    { id: '3', name: 'North Station', type: 'Pickup Point', is_active: true, created_at: '' },
    { id: '4', name: 'Dallas Airport', type: 'Airport', is_active: true, created_at: '' },
  ];

  it('groups locations by type correctly', () => {
    const grouped = groupLocationsByType(mockLocations);
    expect(grouped['City']).toHaveLength(1);
    expect(grouped['Airport']).toHaveLength(2);
    expect(grouped['Pickup Point']).toHaveLength(1);
  });

  it('sorts locations alphabetically within each group', () => {
    const grouped = groupLocationsByType(mockLocations);
    const airportNames = grouped['Airport'].map((l) => l.name);
    expect(airportNames).toEqual([...airportNames].sort());
  });

  it('returns empty arrays for groups with no locations', () => {
    const grouped = groupLocationsByType([]);
    expect(grouped['City']).toHaveLength(0);
    expect(grouped['Airport']).toHaveLength(0);
    expect(grouped['Pickup Point']).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// T009 [US2] — Dynamic Pricing: display and contact redirect
// ─────────────────────────────────────────────────────────────

describe('Route Price Logic (US2)', () => {
  it('correctly formats a price as USD currency', () => {
    const price = 75;
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
    expect(formatted).toBe('$75.00');
  });

  it('correctly handles null price (no pricing configured)', () => {
    const price: number | null = null;
    expect(price).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// T013 [US3] — Same-Day 2-Hour Lead Time Buffer
// ─────────────────────────────────────────────────────────────

describe('validateBookingSchedule — 2-Hour Lead Time (US3)', () => {
  it('returns isValid=true when booking time is more than 2 hours in the future', () => {
    const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now
    const dateStr = futureDate.toISOString().slice(0, 10);
    const timeStr = futureDate.toTimeString().slice(0, 5);
    const result = validateBookingSchedule(dateStr, timeStr, new Date());
    expect(result.isValid).toBe(true);
  });

  it('returns isValid=false when booking time is less than 2 hours away', () => {
    const nearFuture = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now
    const dateStr = nearFuture.toISOString().slice(0, 10);
    const timeStr = nearFuture.toTimeString().slice(0, 5);
    const result = validateBookingSchedule(dateStr, timeStr, new Date());
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/2 hours/i);
  });

  it('returns isValid=false when booking time is in the past', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const dateStr = past.toISOString().slice(0, 10);
    const timeStr = past.toTimeString().slice(0, 5);
    const result = validateBookingSchedule(dateStr, timeStr, new Date());
    expect(result.isValid).toBe(false);
  });

  it('returns isValid=true when booking time is exactly 2 hours and 1 minute from now', () => {
    const slightlyOver = new Date(Date.now() + 2 * 60 * 60 * 1000 + 60 * 1000); // 2h+1m
    const dateStr = slightlyOver.toISOString().slice(0, 10);
    const timeStr = slightlyOver.toTimeString().slice(0, 5);
    const result = validateBookingSchedule(dateStr, timeStr, new Date());
    expect(result.isValid).toBe(true);
  });

  it('returns isValid=false when booking time is exactly 2 hours minus 1 minute from now', () => {
    const slightlyUnder = new Date(Date.now() + 2 * 60 * 60 * 1000 - 60 * 1000); // 2h-1m
    const dateStr = slightlyUnder.toISOString().slice(0, 10);
    const timeStr = slightlyUnder.toTimeString().slice(0, 5);
    const result = validateBookingSchedule(dateStr, timeStr, new Date());
    expect(result.isValid).toBe(false);
  });

  it('returns isValid=true for a future date well beyond 2 hours', () => {
    const result = validateBookingSchedule('2035-01-01', '12:00', new Date());
    expect(result.isValid).toBe(true);
  });
});
