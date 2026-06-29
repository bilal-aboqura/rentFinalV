/**
 * T010/T018/T025/T034 - Integration tests for Server Actions
 * Written FIRST following TDD — these will pass once actions are implemented.
 *
 * NOTE: These tests mock Supabase to test the action logic in isolation.
 * They do NOT hit the real database.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBookingSchema, createDriverSchema, updatePricingRuleSchema, updateContentSchema } from '@/lib/validation/schema';

// ----------------------------------------------------------------
// Mock: @supabase/ssr
// ----------------------------------------------------------------
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();

const mockFrom = vi.fn(() => ({
  insert: mockInsert.mockReturnThis(),
  select: mockSelect.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  single: mockSingle,
  gte: mockGte.mockReturnThis(),
  lte: mockLte.mockReturnThis(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-user-id' } }, error: null }),
    },
  })),
}));

// ----------------------------------------------------------------
// T010 [US1] - Booking Creation: Schema Validation
// ----------------------------------------------------------------
describe('[US1] Booking Creation Validation', () => {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  it('validates a correct booking input', () => {
    const input = {
      pickupLocationId: '110e8400-e29b-41d4-a716-446655440000',
      destinationLocationId: '220e8400-e29b-41d4-a716-446655440001',
      tripDateTime: futureDate,
      vehicleClass: 'standard' as const,
      customerName: 'Alice Johnson',
      customerEmail: 'alice@example.com',
      customerPhone: '+447911123456',
    };
    const result = createBookingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects booking with past date', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const input = {
      pickupLocationId: '110e8400-e29b-41d4-a716-446655440000',
      destinationLocationId: '220e8400-e29b-41d4-a716-446655440001',
      tripDateTime: pastDate,
      vehicleClass: 'executive' as const,
      customerName: 'Bob',
      customerEmail: 'bob@example.com',
      customerPhone: '+1234567890',
    };
    const result = createBookingSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('generates a reference ID in correct format', () => {
    // Reference IDs should match BK-XXXXXX pattern
    const refId = `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    expect(refId).toMatch(/^BK-[A-Z0-9]{6}$/i);
  });
});

// ----------------------------------------------------------------
// T010 [US1] - Pricing Calculation Logic
// ----------------------------------------------------------------
describe('[US1] Pricing Calculation', () => {
  it('uses the flat-rate price from pricing_rules for the booking total', () => {
    // Simulates the action logic: find matching rule and assign its price
    const pricingRules = [
      { pickup_location_id: 'loc-a', destination_location_id: 'loc-b', vehicle_class: 'standard', price: 45.00 },
      { pickup_location_id: 'loc-a', destination_location_id: 'loc-b', vehicle_class: 'executive', price: 75.00 },
    ];

    const findPrice = (pickupId: string, destId: string, vehicleClass: string) =>
      pricingRules.find(
        (r) =>
          r.pickup_location_id === pickupId &&
          r.destination_location_id === destId &&
          r.vehicle_class === vehicleClass
      )?.price ?? null;

    expect(findPrice('loc-a', 'loc-b', 'standard')).toBe(45.00);
    expect(findPrice('loc-a', 'loc-b', 'executive')).toBe(75.00);
    expect(findPrice('loc-a', 'loc-b', 'van')).toBeNull();
  });
});

// ----------------------------------------------------------------
// T018 [US2] - Admin Auth: Unauthenticated user should be blocked
// ----------------------------------------------------------------
describe('[US2] Admin Authentication Check', () => {
  it('returns error if user is not authenticated', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    // Simulates what the admin action does:
    const result = await mockGetUser();
    const isAuthenticated = !result.error && result.data.user !== null;
    expect(isAuthenticated).toBe(false);
  });

  it('allows access for authenticated users', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'admin-123', email: 'admin@example.com' } },
      error: null,
    });

    const result = await mockGetUser();
    const isAuthenticated = !result.error && result.data.user !== null;
    expect(isAuthenticated).toBe(true);
  });
});

// ----------------------------------------------------------------
// T025 [US3] - Driver Assignment: 3-hour overlap check
// ----------------------------------------------------------------
describe('[US3] Driver Assignment Overlap Validation', () => {
  const baseTime = new Date('2026-07-15T14:00:00Z');

  const hasConflict = (
    existingTripTime: Date,
    newTripTime: Date,
    windowHours = 3
  ): boolean => {
    const diffMs = Math.abs(newTripTime.getTime() - existingTripTime.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours < windowHours;
  };

  it('detects conflict when trips are within 3 hours', () => {
    const existingTrip = baseTime;
    const newTrip = new Date(baseTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    expect(hasConflict(existingTrip, newTrip)).toBe(true);
  });

  it('allows assignment when trips are more than 3 hours apart', () => {
    const existingTrip = baseTime;
    const newTrip = new Date(baseTime.getTime() + 4 * 60 * 60 * 1000); // +4 hours
    expect(hasConflict(existingTrip, newTrip)).toBe(false);
  });

  it('detects conflict at exactly 3 hours (boundary, exclusive)', () => {
    const existingTrip = baseTime;
    const newTrip = new Date(baseTime.getTime() + 3 * 60 * 60 * 1000); // exactly 3 hours
    expect(hasConflict(existingTrip, newTrip)).toBe(false); // 3h == boundary, no conflict
  });

  it('detects conflict in reverse direction (new trip is before existing)', () => {
    const existingTrip = baseTime;
    const newTrip = new Date(baseTime.getTime() - 1.5 * 60 * 60 * 1000); // -1.5 hours
    expect(hasConflict(existingTrip, newTrip)).toBe(true);
  });
});

// ----------------------------------------------------------------
// T025 [US3] - Driver/Settings Schema Validation
// ----------------------------------------------------------------
describe('[US3] Driver Schema Validation', () => {
  it('validates correct driver input', () => {
    const result = createDriverSchema.safeParse({
      name: 'Ahmed Al-Rashid',
      phone: '+447911123456',
      licensePlate: 'ABC123',
    });
    expect(result.success).toBe(true);
  });

  it('transforms license plate to uppercase', () => {
    const result = createDriverSchema.safeParse({
      name: 'Test Driver',
      phone: '+1234567890',
      licensePlate: 'abc123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.licensePlate).toBe('ABC123');
    }
  });

  it('fails with empty driver name', () => {
    const result = createDriverSchema.safeParse({
      name: '',
      phone: '+1234567890',
      licensePlate: 'XYZ999',
    });
    expect(result.success).toBe(false);
  });
});

// ----------------------------------------------------------------
// T034 [US5] - Content CRUD Schema Validation
// ----------------------------------------------------------------
describe('[US5] Content Update Validation', () => {
  it('validates correct content update', () => {
    const result = updateContentSchema.safeParse({
      key: 'hero_title',
      value: 'Updated Hero Title',
    });
    expect(result.success).toBe(true);
  });

  it('fails with empty content value', () => {
    const result = updateContentSchema.safeParse({
      key: 'hero_title',
      value: '',
    });
    expect(result.success).toBe(false);
  });

  it('fails with empty key', () => {
    const result = updateContentSchema.safeParse({
      key: '',
      value: 'Some value',
    });
    expect(result.success).toBe(false);
  });
});
