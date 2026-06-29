/**
 * T021 [US5] - Vitest tests for customer pricing query (booking wizard).
 *
 * Spec: specs/003-pricing-management/contracts/actions.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const VALID_UUID_A = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_B = '660e8400-e29b-41d4-a716-446655440001';

const mockSelect = vi.fn();
const mockEq1 = vi.fn();
const mockEq2 = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}));

describe('getRoutePriceAction (booking wizard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockMaybeSingle.mockResolvedValue({
      data: { price: 75 },
      error: null,
    });
    mockEq2.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockSelect.mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('should return price for a valid route', async () => {
    const { getRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await getRoutePriceAction(VALID_UUID_A, VALID_UUID_B);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.price).toBe(75);
    }
  });

  it('should return error when route has no price configured', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const { getRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await getRoutePriceAction(VALID_UUID_A, VALID_UUID_B);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('No pricing available');
    }
  });

  it('should return error for invalid UUID inputs', async () => {
    const { getRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await getRoutePriceAction('not-a-uuid', VALID_UUID_B);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid');
    }
  });

  it('should handle database errors gracefully', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection timeout' },
    });

    const { getRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await getRoutePriceAction(VALID_UUID_A, VALID_UUID_B);

    expect(result.success).toBe(false);
  });
});
