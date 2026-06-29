/**
 * Spec 004: Drivers Management
 * Unit tests for CreateDriverSchema and UpdateDriverSchema validation.
 */
import { describe, it, expect } from 'vitest';
import { CreateDriverSchema, UpdateDriverSchema } from '@/lib/validation/driver';

describe('CreateDriverSchema', () => {
  it('should parse valid input with default status', () => {
    const result = CreateDriverSchema.safeParse({
      name: 'John Doe',
      phone: '+15550100111',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.phone).toBe('+15550100111');
      expect(result.data.availability_status).toBe('Available');
    }
  });

  it('should normalize phone number (remove spaces and dashes)', () => {
    const result = CreateDriverSchema.safeParse({
      name: 'Alice Green',
      phone: '+1 555-010-0200',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('+15550100200');
    }
  });

  it('should trim whitespace from name', () => {
    const result = CreateDriverSchema.safeParse({
      name: '  Bob Smith  ',
      phone: '+15550100333',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Bob Smith');
    }
  });

  it('should reject name shorter than 2 characters', () => {
    const result = CreateDriverSchema.safeParse({
      name: 'A',
      phone: '+15550100444',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name).toContain('Name must be at least 2 characters long');
    }
  });

  it('should reject name longer than 100 characters', () => {
    const result = CreateDriverSchema.safeParse({
      name: 'A'.repeat(101),
      phone: '+15550100555',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name).toContain('Name must not exceed 100 characters');
    }
  });

  it('should reject phone shorter than 10 chars (after normalization)', () => {
    const result = CreateDriverSchema.safeParse({
      name: 'Valid Name',
      phone: '123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.phone).toBeDefined();
    }
  });

  it('should accept all valid availability statuses', () => {
    for (const status of ['Available', 'Busy', 'Inactive'] as const) {
      const result = CreateDriverSchema.safeParse({
        name: 'Driver Name',
        phone: '+15550100999',
        availability_status: status,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.availability_status).toBe(status);
      }
    }
  });

  it('should reject invalid availability status', () => {
    const result = CreateDriverSchema.safeParse({
      name: 'Driver Name',
      phone: '+15550100999',
      availability_status: 'OnLeave',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.availability_status).toContain('Invalid availability status');
    }
  });
});

describe('UpdateDriverSchema', () => {
  it('should parse a valid update with only id', () => {
    const result = UpdateDriverSchema.safeParse({
      id: '880e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('880e8400-e29b-41d4-a716-446655440000');
      expect(result.data.name).toBeUndefined();
    }
  });

  it('should reject an invalid UUID id', () => {
    const result = UpdateDriverSchema.safeParse({
      id: 'not-a-uuid',
      name: 'New Name',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.id).toContain('Invalid ID format');
    }
  });

  it('should normalize phone number in update', () => {
    const result = UpdateDriverSchema.safeParse({
      id: '880e8400-e29b-41d4-a716-446655440000',
      phone: '+1 (555) 010-0100',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('+15550100100');
    }
  });

  it('should allow partial updates (all optional fields)', () => {
    const result = UpdateDriverSchema.safeParse({
      id: '880e8400-e29b-41d4-a716-446655440000',
      availability_status: 'Inactive',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.availability_status).toBe('Inactive');
      expect(result.data.name).toBeUndefined();
      expect(result.data.phone).toBeUndefined();
    }
  });
});
