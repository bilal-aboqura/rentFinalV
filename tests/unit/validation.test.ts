import { describe, it, expect } from 'vitest';
import { CreateLocationSchema, UpdateLocationSchema } from '@/lib/validation/location';

describe('Location validation schemas', () => {
  describe('CreateLocationSchema', () => {
    it('should validate valid create inputs', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'Austin City',
        type: 'City',
        isActive: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Austin City');
        expect(result.data.type).toBe('City');
        expect(result.data.isActive).toBe(true);
      }
    });

    it('should reject invalid location types', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'Invalid Place',
        type: 'State', // Invalid enum value
        isActive: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });

    it('should reject names that are too short or empty', () => {
      const result = CreateLocationSchema.safeParse({
        name: 'A', // Too short
        type: 'Pickup Point',
        isActive: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });
  });

  describe('UpdateLocationSchema', () => {
    it('should require a valid UUID for updates', () => {
      const result = UpdateLocationSchema.safeParse({
        id: '123-invalid-uuid',
        name: 'Valid Name',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid ID format');
      }
    });

    it('should pass with a valid UUID and subset of fields', () => {
      const result = UpdateLocationSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });
});
