/**
 * T014 [US3] - Vitest mock tests for updateRoutePriceAction.
 *
 * Spec: specs/003-pricing-management/contracts/actions.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const VALID_UUID_A = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_B = '660e8400-e29b-41d4-a716-446655440001';
const RULE_UUID = '770e8400-e29b-41d4-a716-446655440000';

const mockUpdate = vi.fn();
const mockEq = vi.fn();
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

describe('updateRoutePriceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSingle.mockResolvedValue({
      data: {
        id: RULE_UUID,
        pickup_location_id: VALID_UUID_A,
        destination_location_id: VALID_UUID_B,
        price: 90,
        created_at: '2026-06-23T17:00:00Z',
        pickup_location: { name: 'Riyadh' },
        destination_location: { name: 'KFIA Airport' },
      },
      error: null,
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });
  });

  it('should update a pricing rule price successfully', async () => {
    const { updateRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await updateRoutePriceAction({ id: RULE_UUID, price: 90 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.price).toBe(90);
    }
  });

  it('should return validation error for invalid UUID in id field', async () => {
    const { updateRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await updateRoutePriceAction({ id: 'bad-id', price: 100 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors).toBeDefined();
    }
  });

  it('should return validation error for non-positive price', async () => {
    const { updateRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await updateRoutePriceAction({ id: RULE_UUID, price: -5 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors?.price).toBeDefined();
    }
  });

  it('should handle duplicate route constraint on edit', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '23505', message: 'duplicate key value' },
    });

    const { updateRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await updateRoutePriceAction({
      id: RULE_UUID,
      pickupLocationId: VALID_UUID_A,
      destinationLocationId: VALID_UUID_B,
      price: 50,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('already exists');
    }
  });

  it('should handle not-found case', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    const { updateRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await updateRoutePriceAction({ id: RULE_UUID, price: 50 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('not found');
    }
  });
});
