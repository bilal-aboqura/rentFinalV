import { describe, it, expect } from 'vitest';
import { BookingStep1Schema } from '@/lib/validation/booking';
import { validateBookingSchedule } from '@/app/actions/booking';
import { groupLocationsByType } from '@/lib/utils/groupLocations';
import { Location } from '@/types';

describe('Booking Wizard Step 1 Validations', () => {
  describe('BookingStep1Schema', () => {
    const validUuid1 = '550e8400-e29b-41d4-a716-446655440000';
    const validUuid2 = '550e8400-e29b-41d4-a716-446655440001';

    it('should pass with valid, different location IDs and date/time', () => {
      const result = BookingStep1Schema.safeParse({
        pickupLocationId: validUuid1,
        destinationLocationId: validUuid2,
        date: '2026-06-26',
        time: '15:30',
      });
      expect(result.success).toBe(true);
    });

    it('should reject same pickup and destination location IDs', () => {
      const result = BookingStep1Schema.safeParse({
        pickupLocationId: validUuid1,
        destinationLocationId: validUuid1,
        date: '2026-06-26',
        time: '15:30',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be different');
      }
    });

    it('should reject invalid UUIDs', () => {
      const result = BookingStep1Schema.safeParse({
        pickupLocationId: 'invalid-id',
        destinationLocationId: validUuid2,
        date: '2026-06-26',
        time: '15:30',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const result = BookingStep1Schema.safeParse({
        pickupLocationId: validUuid1,
        destinationLocationId: validUuid2,
        date: '26-06-2026', // wrong format
        time: '15:30',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid time format', () => {
      const result = BookingStep1Schema.safeParse({
        pickupLocationId: validUuid1,
        destinationLocationId: validUuid2,
        date: '2026-06-26',
        time: '3:30 PM', // wrong format
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validateBookingSchedule lead-time helper', () => {
    // 2026-06-26T12:00:00 is our mock server reference time
    const referenceDate = new Date('2026-06-26T12:00:00');

    it('should fail for bookings in the past', () => {
      const result = validateBookingSchedule('2026-06-26', '10:00', referenceDate);
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be in the past');
    });

    it('should fail for bookings within the 2-hour buffer (e.g., 1.5 hours in future)', () => {
      const result = validateBookingSchedule('2026-06-26', '13:30', referenceDate);
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 hours in advance');
    });

    it('should pass for bookings exactly 2 hours in the future', () => {
      const result = validateBookingSchedule('2026-06-26', '14:00', referenceDate);
      expect(result.success).toBe(true);
    });

    it('should pass for bookings well in the future (e.g., next day)', () => {
      const result = validateBookingSchedule('2026-06-27', '09:00', referenceDate);
      expect(result.success).toBe(true);
    });

    it('should fail for invalid input formats', () => {
      const result1 = validateBookingSchedule('invalid-date', '12:00', referenceDate);
      expect(result1.success).toBe(false);
      const result2 = validateBookingSchedule('2026-06-26', 'invalid-time', referenceDate);
      expect(result2.success).toBe(false);
    });
  });

  describe('groupLocationsByType helper', () => {
    const mockLocations: Location[] = [
      { id: '1', name: 'Z - City', type: 'City', isActive: true },
      { id: '2', name: 'A - Airport', type: 'Airport', isActive: true },
      { id: '3', name: 'A - City', type: 'City', isActive: true },
      { id: '4', name: 'P - Point', type: 'Pickup Point', isActive: true },
    ];

    it('should group locations by type correctly and sort alphabetically', () => {
      const result = groupLocationsByType(mockLocations);
      expect(result.Cities).toHaveLength(2);
      expect(result.Cities[0].name).toBe('A - City');
      expect(result.Cities[1].name).toBe('Z - City');
      expect(result.Airports).toHaveLength(1);
      expect(result.Airports[0].name).toBe('A - Airport');
      expect(result.Point).toBeUndefined();
      expect(result['Pickup Points']).toHaveLength(1);
    });
  });
});
