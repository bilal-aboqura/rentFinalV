/**
 * T009 [Foundational] - Vitest unit tests for Location validation schemas.
 * Written FIRST following TDD — these tests should PASS once location.ts is in place.
 */
import { describe, it, expect } from 'vitest';
import { CreateLocationSchema, UpdateLocationSchema } from '@/lib/validation/location';

describe('Location Validation Schemas', () => {
  // ----------------------------------------------------------------
  // CreateLocationSchema
  // ----------------------------------------------------------------
  describe('CreateLocationSchema', () => {
    it('should validate a valid City location', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'London',
        type: 'City',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true); // default
      }
    });

    it('should validate a valid Airport location', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'London Heathrow',
        type: 'Airport',
        isActive: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(false);
      }
    });

    it('should validate a valid Pickup Point location', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'Central Station',
        type: 'Pickup Point',
      });
      expect(result.success).toBe(true);
    });

    it('should reject an invalid location type', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'London',
        type: 'city', // lowercase is invalid per spec
      });
      expect(result.success).toBe(false);
    });

    it('should reject names that are too short', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'A',
        type: 'City',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toContain(
          'Location name must be at least 2 characters long'
        );
      }
    });

    it('should reject names that are empty', () => {
      const result = CreateLocationSchema.safeParse({
        name: '',
        type: 'Airport',
      });
      expect(result.success).toBe(false);
    });

    it('should reject names that are too long', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'A'.repeat(101),
        type: 'City',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toContain(
          'Location name cannot exceed 100 characters'
        );
      }
    });

    it('should trim whitespace from name', () => {
      const result = CreateLocationSchema.safeParse({
        name: '  London  ',
        type: 'City',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('London');
      }
    });
  });

  // ----------------------------------------------------------------
  // UpdateLocationSchema
  // ----------------------------------------------------------------
  describe('UpdateLocationSchema', () => {
    it('should validate a partial update with a valid UUID', () => {
      const result = UpdateLocationSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Manchester Airport',
      });
      expect(result.success).toBe(true);
    });

    it('should validate updating the isActive flag only', () => {
      const result = UpdateLocationSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject an invalid UUID for id', () => {
      const result = UpdateLocationSchema.safeParse({
        id: 'not-a-uuid',
        name: 'London',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.id).toContain('Invalid ID format');
      }
    });

    it('should reject an invalid type in update', () => {
      const result = UpdateLocationSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'invalid-type',
      });
      expect(result.success).toBe(false);
    });
  });
});
