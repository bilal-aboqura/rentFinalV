import { describe, it, expect } from 'vitest';
import { CreateRoutePriceSchema, UpdateRoutePriceSchema } from '@/lib/validation/pricing';

describe('Route price validation schemas', () => {
  describe('CreateRoutePriceSchema', () => {
    it('should validate valid create inputs', () => {
      const result = CreateRoutePriceSchema.safeParse({
        pickupLocationId: '550e8400-e29b-41d4-a716-446655440000',
        destinationLocationId: '660e8400-e29b-41d4-a716-446655440000',
        price: 55.50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pickupLocationId).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(result.data.destinationLocationId).toBe('660e8400-e29b-41d4-a716-446655440000');
        expect(result.data.price).toBe(55.50);
      }
    });

    it('should reject invalid UUID formats', () => {
      const result = CreateRoutePriceSchema.safeParse({
        pickupLocationId: 'invalid-uuid',
        destinationLocationId: '660e8400-e29b-41d4-a716-446655440000',
        price: 50.00,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid pickup location ID');
      }
    });

    it('should reject non-positive prices (<= 0)', () => {
      const result1 = CreateRoutePriceSchema.safeParse({
        pickupLocationId: '550e8400-e29b-41d4-a716-446655440000',
        destinationLocationId: '660e8400-e29b-41d4-a716-446655440000',
        price: 0,
      });
      const result2 = CreateRoutePriceSchema.safeParse({
        pickupLocationId: '550e8400-e29b-41d4-a716-446655440000',
        destinationLocationId: '660e8400-e29b-41d4-a716-446655440000',
        price: -10.50,
      });

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      if (!result1.success) {
        expect(result1.error.issues[0].message).toContain('Price must be a positive number');
      }
    });

    it('should reject identical pickup and destination IDs', () => {
      const result = CreateRoutePriceSchema.safeParse({
        pickupLocationId: '550e8400-e29b-41d4-a716-446655440000',
        destinationLocationId: '550e8400-e29b-41d4-a716-446655440000',
        price: 45.00,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be different');
      }
    });
  });

  describe('UpdateRoutePriceSchema', () => {
    it('should validate valid update inputs', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: '770e8400-e29b-41d4-a716-446655440000',
        price: 60.00,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(60.00);
      }
    });

    it('should reject updates with identical pickup and destination IDs', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: '770e8400-e29b-41d4-a716-446655440000',
        pickupLocationId: '550e8400-e29b-41d4-a716-446655440000',
        destinationLocationId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be different');
      }
    });

    it('should reject update payloads that do not change any editable field', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: '770e8400-e29b-41d4-a716-446655440000',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one pricing field must be provided');
      }
    });

    it('should require a valid UUID for pricing rule id', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: 'invalid-id',
        price: 50.00,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid ID format');
      }
    });
  });
});
