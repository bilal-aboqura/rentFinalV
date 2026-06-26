import { describe, it, expect } from 'vitest';
import { BookingStep2Schema, SubmitBookingSchema } from '@/lib/validation/booking';

describe('Booking Wizard Step 2 Validations', () => {
  describe('BookingStep2Schema', () => {
    it('should pass with valid customer details', () => {
      const result = BookingStep2Schema.safeParse({
        customerName: 'Alice Johnson',
        customerEmail: 'alice@example.com',
        customerPhone: '+15551234567',
        flightNumber: 'UA102',
        notes: 'Need extra trunk space.',
      });
      expect(result.success).toBe(true);
    });

    it('should pass without optional fields', () => {
      const result = BookingStep2Schema.safeParse({
        customerName: 'Bob Smith',
        customerEmail: 'bob@example.com',
        customerPhone: '+442079460192',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty or missing customerName', () => {
      const result = BookingStep2Schema.safeParse({
        customerName: '',
        customerEmail: 'bob@example.com',
        customerPhone: '+442079460192',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('name is required');
      }
    });

    it('should reject invalid email formats', () => {
      const result = BookingStep2Schema.safeParse({
        customerName: 'Bob Smith',
        customerEmail: 'not-an-email',
        customerPhone: '+442079460192',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email address');
      }
    });

    it('should reject non-E.164 phone formats', () => {
      const invalidPhones = [
        '1234567890',      // missing +
        '+1',              // too short
        '+12345',          // too short (must be at least 7 digits following standard)
        '+1234567890123456', // too long (exceeds 15 digits)
        '+1-555-123-4567', // contains hyphens
        '+1 (555) 123-4567' // contains spaces and parens
      ];

      invalidPhones.forEach(phone => {
        const result = BookingStep2Schema.safeParse({
          customerName: 'Bob Smith',
          customerEmail: 'bob@example.com',
          customerPhone: phone,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('international E.164 format');
        }
      });
    });
  });

  describe('SubmitBookingSchema', () => {
    const validUuid1 = '550e8400-e29b-41d4-a716-446655440000';
    const validUuid2 = '550e8400-e29b-41d4-a716-446655440001';

    it('should pass with fully valid Step 1 & Step 2 details', () => {
      const result = SubmitBookingSchema.safeParse({
        pickupLocationId: validUuid1,
        destinationLocationId: validUuid2,
        date: '2026-06-26',
        time: '15:30',
        price: 75.50,
        customerName: 'Charlie Brown',
        customerEmail: 'charlie@peanuts.com',
        customerPhone: '+16505550199',
        flightNumber: '',
        notes: null
      });
      expect(result.success).toBe(true);
    });

    it('should reject same pickup and destination location IDs', () => {
      const result = SubmitBookingSchema.safeParse({
        pickupLocationId: validUuid1,
        destinationLocationId: validUuid1,
        date: '2026-06-26',
        time: '15:30',
        price: 75.50,
        customerName: 'Charlie Brown',
        customerEmail: 'charlie@peanuts.com',
        customerPhone: '+16505550199',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be different');
      }
    });

    it('should reject negative prices', () => {
      const result = SubmitBookingSchema.safeParse({
        pickupLocationId: validUuid1,
        destinationLocationId: validUuid2,
        date: '2026-06-26',
        time: '15:30',
        price: -10,
        customerName: 'Charlie Brown',
        customerEmail: 'charlie@peanuts.com',
        customerPhone: '+16505550199',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative');
      }
    });
  });
});
