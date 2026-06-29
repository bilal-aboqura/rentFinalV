/**
 * T009 [US1] - Unit tests for booking form validation and submit states
 * These tests are written FIRST and will fail until the component is implemented.
 */
import { describe, it, expect } from 'vitest';
import { createBookingSchema, contactSchema } from '@/lib/validation/schema';

// ----------------------------------------------------------------
// Booking Schema Validation Tests
// ----------------------------------------------------------------
describe('createBookingSchema', () => {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // +1 day
  const pastDate = new Date(Date.now() - 60 * 1000).toISOString(); // -1 minute

  const validInput = {
    pickupLocationId: '110e8400-e29b-41d4-a716-446655440000',
    destinationLocationId: '220e8400-e29b-41d4-a716-446655440001',
    tripDateTime: futureDate,
    vehicleClass: 'standard' as const,
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    customerPhone: '+1234567890',
  };

  it('passes with valid input', () => {
    const result = createBookingSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('fails when tripDateTime is in the past', () => {
    const result = createBookingSchema.safeParse({ ...validInput, tripDateTime: pastDate });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.flatten().fieldErrors.tripDateTime;
      expect(messages).toContain('Booking date and time must be in the future.');
    }
  });

  it('fails with invalid email', () => {
    const result = createBookingSchema.safeParse({ ...validInput, customerEmail: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.flatten().fieldErrors.customerEmail;
      expect(messages?.[0]).toContain('valid email');
    }
  });

  it('fails with invalid vehicleClass', () => {
    const result = createBookingSchema.safeParse({ ...validInput, vehicleClass: 'helicopter' });
    expect(result.success).toBe(false);
  });

  it('fails when pickup and destination are the same', () => {
    const result = createBookingSchema.safeParse({
      ...validInput,
      destinationLocationId: validInput.pickupLocationId,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.flatten().fieldErrors.destinationLocationId;
      expect(messages?.[0]).toContain('different');
    }
  });

  it('fails with empty customerName', () => {
    const result = createBookingSchema.safeParse({ ...validInput, customerName: '' });
    expect(result.success).toBe(false);
  });

  it('fails with invalid UUID for pickupLocationId', () => {
    const result = createBookingSchema.safeParse({ ...validInput, pickupLocationId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

// ----------------------------------------------------------------
// Contact Schema Validation Tests
// ----------------------------------------------------------------
describe('contactSchema', () => {
  const validContact = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    message: 'Hello, I have a question about my booking.',
  };

  it('passes with valid contact input', () => {
    const result = contactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it('fails with message shorter than 10 characters', () => {
    const result = contactSchema.safeParse({ ...validContact, message: 'Short' });
    expect(result.success).toBe(false);
  });

  it('fails with invalid email', () => {
    const result = contactSchema.safeParse({ ...validContact, email: 'bad-email' });
    expect(result.success).toBe(false);
  });

  it('fails with empty name', () => {
    const result = contactSchema.safeParse({ ...validContact, name: '' });
    expect(result.success).toBe(false);
  });
});
