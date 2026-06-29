/**
 * T010 [US2] - Vitest mock tests for createRoutePriceAction.
 *
 * Spec: specs/003-pricing-management/contracts/actions.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const VALID_UUID_A = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_B = '660e8400-e29b-41d4-a716-446655440001';

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null }),
    },
    from: mockFrom,
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('createRoutePriceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSingle.mockResolvedValue({
      data: {
        id: '770e8400-e29b-41d4-a716-446655440000',
        pickup_location_id: VALID_UUID_A,
        destination_location_id: VALID_UUID_B,
        price: 75,
        created_at: '2026-06-23T17:00:00Z',
        pickup_location: { name: 'Riyadh' },
        destination_location: { name: 'KFIA Airport' },
      },
      error: null,
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });
  });

  it('should create a route price successfully with valid input', async () => {
    const { createRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await createRoutePriceAction({
      pickupLocationId: VALID_UUID_A,
      destinationLocationId: VALID_UUID_B,
      price: 75.0,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data?.price).toBe(75);
    }
  });

  it('should return validationErrors for invalid input (bad UUID)', async () => {
    const { createRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await createRoutePriceAction({
      pickupLocationId: 'not-a-uuid',
      destinationLocationId: VALID_UUID_B,
      price: 50,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.pickupLocationId).toBeDefined();
    }
  });

  it('should return validationErrors for non-positive price', async () => {
    const { createRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await createRoutePriceAction({
      pickupLocationId: VALID_UUID_A,
      destinationLocationId: VALID_UUID_B,
      price: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors?.price).toBeDefined();
    }
  });

  it('should return validationErrors when pickup equals destination', async () => {
    const { createRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await createRoutePriceAction({
      pickupLocationId: VALID_UUID_A,
      destinationLocationId: VALID_UUID_A,
      price: 50,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors?.destinationLocationId).toBeDefined();
    }
  });

  it('should handle duplicate route constraint error from database', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'unique constraint violation' },
    });

    const { createRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await createRoutePriceAction({
      pickupLocationId: VALID_UUID_A,
      destinationLocationId: VALID_UUID_B,
      price: 50,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('already exists');
    }
  });
});
