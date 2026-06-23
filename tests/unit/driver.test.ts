import { describe, it, expect } from 'vitest';
import { CreateDriverSchema, UpdateDriverSchema } from '@/lib/validation/driver';

describe('Driver validation schemas', () => {
  describe('CreateDriverSchema', () => {
    it('should validate and parse valid inputs with normalization', () => {
      const result = CreateDriverSchema.safeParse({
        name: '  John Doe  ',
        phone: '+1 (555) 123-4567',
        availability_status: 'Available',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe'); // Trimming
        expect(result.data.phone).toBe('+15551234567'); // Normalization
        expect(result.data.availability_status).toBe('Available');
      }
    });

    it('should default availability_status to Available', () => {
      const result = CreateDriverSchema.safeParse({
        name: 'John Doe',
        phone: '1234567890',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.availability_status).toBe('Available');
      }
    });

    it('should reject names that are too short', () => {
      const result = CreateDriverSchema.safeParse({
        name: 'A', // Too short
        phone: '1234567890',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject names that are too long', () => {
      const result = CreateDriverSchema.safeParse({
        name: 'A'.repeat(101),
        phone: '1234567890',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('not exceed 100 characters');
      }
    });

    it('should reject phone numbers that are too short', () => {
      const result = CreateDriverSchema.safeParse({
        name: 'John Doe',
        phone: '123456', // Too short
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 10 characters');
      }
    });

    it('should reject invalid availability status', () => {
      const result = CreateDriverSchema.safeParse({
        name: 'John Doe',
        phone: '1234567890',
        availability_status: 'On Vacation', // Invalid enum
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid availability status');
      }
    });
  });

  describe('UpdateDriverSchema', () => {
    it('should require a valid UUID for id', () => {
      const result = UpdateDriverSchema.safeParse({
        id: 'invalid-uuid',
        name: 'Valid Name',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid ID format');
      }
    });

    it('should pass with valid UUID and optional subset of fields', () => {
      const result = UpdateDriverSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        availability_status: 'Inactive',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.availability_status).toBe('Inactive');
        expect(result.data.name).toBeUndefined();
      }
    });
  });
});
