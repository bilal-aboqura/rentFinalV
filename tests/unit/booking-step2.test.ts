/**
 * Booking Wizard Step 2 — Vitest Unit Tests
 *
 * Tests for:
 * - BookingStep2Schema (passenger details form validation)
 * - SubmitBookingSchema (full booking payload validation)
 * - E.164 phone number validation
 *
 * Spec: specs/006-booking-wizard-step2/data-model.md
 */

import { describe, it, expect } from 'vitest';
import { BookingStep2Schema, SubmitBookingSchema, E164_PHONE_REGEX } from '@/lib/validation/booking';

const PICKUP_ID = '00000000-0000-0000-0000-000000000001';
const DEST_ID   = '00000000-0000-0000-0000-000000000002';

// ─────────────────────────────────────────────────────────────
// T004 [US1] — BookingStep2Schema
// ─────────────────────────────────────────────────────────────

describe('BookingStep2Schema — Passenger Details Validation (US1)', () => {
  const validStep2 = {
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    customerPhone: '+15551234567',
  };

  it('passes with valid required fields', () => {
    const result = BookingStep2Schema.safeParse(validStep2);
    expect(result.success).toBe(true);
  });

  it('passes with optional fields included', () => {
    const result = BookingStep2Schema.safeParse({
      ...validStep2,
      flightNumber: 'AB123',
      notes: 'Prefer child seat.',
    });
    expect(result.success).toBe(true);
  });

  it('passes when optional fields are empty strings', () => {
    const result = BookingStep2Schema.safeParse({
      ...validStep2,
      flightNumber: '',
      notes: '',
    });
    expect(result.success).toBe(true);
  });

  it('fails when customerName is blank', () => {
    const result = BookingStep2Schema.safeParse({ ...validStep2, customerName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('customerName'))).toBe(true);
    }
  });

  it('fails when customerEmail is invalid', () => {
    const result = BookingStep2Schema.safeParse({ ...validStep2, customerEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('fails when customerPhone is missing E.164 + prefix', () => {
    const result = BookingStep2Schema.safeParse({ ...validStep2, customerPhone: '5551234567' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const phoneError = result.error.issues.find((i) => i.path.includes('customerPhone'));
      expect(phoneError?.message).toMatch(/E\.164/i);
    }
  });

  it('fails when customerPhone is too short', () => {
    const result = BookingStep2Schema.safeParse({ ...validStep2, customerPhone: '+1' });
    expect(result.success).toBe(false);
  });

  it('fails when flightNumber exceeds 20 characters', () => {
    const result = BookingStep2Schema.safeParse({
      ...validStep2,
      flightNumber: 'A'.repeat(21),
    });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// E.164 Phone Regex
// ─────────────────────────────────────────────────────────────

describe('E164_PHONE_REGEX — International Format', () => {
  const valid = ['+15551234567', '+447911123456', '+33612345678', '+8613812345678'];
  const invalid = ['5551234567', '+1', '0015551234567', '+0123456789', 'not-a-phone'];

  valid.forEach((phone) => {
    it(`accepts valid E.164 phone: ${phone}`, () => {
      expect(E164_PHONE_REGEX.test(phone)).toBe(true);
    });
  });

  invalid.forEach((phone) => {
    it(`rejects invalid phone: ${phone}`, () => {
      expect(E164_PHONE_REGEX.test(phone)).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// T004 [US1] — SubmitBookingSchema (full payload)
// ─────────────────────────────────────────────────────────────

describe('SubmitBookingSchema — Full Booking Payload (US1)', () => {
  const validPayload = {
    pickupLocationId: PICKUP_ID,
    destinationLocationId: DEST_ID,
    date: '2030-12-31',
    time: '14:00',
    price: 75,
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    customerPhone: '+15551234567',
  };

  it('passes with valid complete payload', () => {
    const result = SubmitBookingSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('fails when price is negative', () => {
    const result = SubmitBookingSchema.safeParse({ ...validPayload, price: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('price'))).toBe(true);
    }
  });

  it('passes when price is zero', () => {
    const result = SubmitBookingSchema.safeParse({ ...validPayload, price: 0 });
    expect(result.success).toBe(true);
  });

  it('fails when pickup and destination are the same', () => {
    const result = SubmitBookingSchema.safeParse({
      ...validPayload,
      destinationLocationId: PICKUP_ID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes('destinationLocationId'))
      ).toBe(true);
    }
  });

  it('fails when pickupLocationId is not a UUID', () => {
    const result = SubmitBookingSchema.safeParse({ ...validPayload, pickupLocationId: 'bad-id' });
    expect(result.success).toBe(false);
  });

  it('fails when customerEmail is invalid', () => {
    const result = SubmitBookingSchema.safeParse({ ...validPayload, customerEmail: 'nope' });
    expect(result.success).toBe(false);
  });

  it('passes with optional flightNumber and notes', () => {
    const result = SubmitBookingSchema.safeParse({
      ...validPayload,
      flightNumber: 'BA456',
      notes: 'Early morning pickup needed.',
    });
    expect(result.success).toBe(true);
  });
});
