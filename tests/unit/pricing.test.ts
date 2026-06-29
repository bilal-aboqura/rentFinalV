/**
 * T005 [Phase 2] - Vitest validation tests for Route Price schemas.
 * Tests MUST fail first (TDD), then pass after T004 implementation.
 *
 * Spec: specs/003-pricing-management/data-model.md
 */
import { describe, it, expect } from 'vitest';
import { CreateRoutePriceSchema, UpdateRoutePriceSchema } from '@/lib/validation/pricing';

const VALID_UUID_A = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_B = '660e8400-e29b-41d4-a716-446655440001';

describe('Route price validation schemas', () => {
  // ----------------------------------------------------------------
  // CreateRoutePriceSchema
  // ----------------------------------------------------------------
  describe('CreateRoutePriceSchema', () => {
    it('should validate valid create inputs', () => {
      const result = CreateRoutePriceSchema.safeParse({
        pickupLocationId: VALID_UUID_A,
        destinationLocationId: VALID_UUID_B,
        price: 75.0,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(75.0);
      }
    });

    it('should reject invalid UUID formats', () => {
      const result = CreateRoutePriceSchema.safeParse({
        pickupLocationId: 'not-a-uuid',
        destinationLocationId: VALID_UUID_B,
        price: 50.0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.pickupLocationId).toBeDefined();
      }
    });

    it('should reject non-positive prices (<= 0)', () => {
      const zeroResult = CreateRoutePriceSchema.safeParse({
        pickupLocationId: VALID_UUID_A,
        destinationLocationId: VALID_UUID_B,
        price: 0,
      });
      expect(zeroResult.success).toBe(false);

      const negativeResult = CreateRoutePriceSchema.safeParse({
        pickupLocationId: VALID_UUID_A,
        destinationLocationId: VALID_UUID_B,
        price: -10,
      });
      expect(negativeResult.success).toBe(false);

      if (!negativeResult.success) {
        const fieldErrors = negativeResult.error.flatten().fieldErrors;
        expect(fieldErrors.price).toBeDefined();
      }
    });

    it('should reject identical pickup and destination IDs', () => {
      const result = CreateRoutePriceSchema.safeParse({
        pickupLocationId: VALID_UUID_A,
        destinationLocationId: VALID_UUID_A,
        price: 50.0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.destinationLocationId).toBeDefined();
        expect(fieldErrors.destinationLocationId?.[0]).toContain('different');
      }
    });

    it('should reject missing required fields', () => {
      const result = CreateRoutePriceSchema.safeParse({
        pickupLocationId: VALID_UUID_A,
        // missing destinationLocationId and price
      });
      expect(result.success).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // UpdateRoutePriceSchema
  // ----------------------------------------------------------------
  describe('UpdateRoutePriceSchema', () => {
    it('should validate valid update inputs', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: VALID_UUID_A,
        price: 90.0,
      });
      expect(result.success).toBe(true);
    });

    it('should allow partial updates (only id required)', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: VALID_UUID_A,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for id field', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: 'invalid-uuid',
        price: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive price in update', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: VALID_UUID_A,
        price: -5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject same pickup and destination IDs when both provided', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: VALID_UUID_A,
        pickupLocationId: VALID_UUID_B,
        destinationLocationId: VALID_UUID_B,
        price: 50.0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(fieldErrors.destinationLocationId).toBeDefined();
      }
    });

    it('should pass when only one of pickup/destination is updated', () => {
      const result = UpdateRoutePriceSchema.safeParse({
        id: VALID_UUID_A,
        pickupLocationId: VALID_UUID_B,
        // destinationLocationId not provided — no same-location check needed
      });
      expect(result.success).toBe(true);
    });
  });
});
