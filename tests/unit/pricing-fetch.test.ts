/**
 * T007 [US1] - Vitest mock tests for fetching route prices.
 * Tests the shape and pagination of getRoutePricesAction.
 *
 * Spec: specs/003-pricing-management/contracts/actions.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RoutePriceRow } from '@/lib/validation/pricing';

// ----------------------------------------------------------------
// Mock Supabase client
// ----------------------------------------------------------------
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-123' } }, error: null }),
    },
    from: mockFrom,
  }),
}));

const mockRoutePrice: RoutePriceRow = {
  id: '770e8400-e29b-41d4-a716-446655440000',
  pickup_location_id: '550e8400-e29b-41d4-a716-446655440000',
  destination_location_id: '660e8400-e29b-41d4-a716-446655440001',
  price: 75.0,
  created_at: '2026-06-23T17:00:00Z',
  pickup_location_name: 'Riyadh',
  destination_location_name: 'KFIA Airport',
};

describe('Route price fetch (getRoutePricesAction)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Chain: from().select().order().range()
    mockRange.mockResolvedValue({
      data: [mockRoutePrice],
      error: null,
      count: 1,
    });
    mockOrder.mockReturnValue({ range: mockRange });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('should return paginated route prices with location names', async () => {
    const { getRoutePricesAction } = await import('@/app/admin/pricing/actions');

    const result = await getRoutePricesAction({ page: 1, pageSize: 10 });

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(Array.isArray(result.data.prices)).toBe(true);
      expect(result.data.prices.length).toBeGreaterThanOrEqual(0);
      expect(typeof result.data.total).toBe('number');
      expect(typeof result.data.totalPages).toBe('number');
    }
  });

  it('should return correct pagination metadata', async () => {
    const { getRoutePricesAction } = await import('@/app/admin/pricing/actions');

    const result = await getRoutePricesAction({ page: 1, pageSize: 5 });
    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(5);
    }
  });

  it('should return empty array when no pricing rules exist', async () => {
    mockRange.mockResolvedValueOnce({ data: [], error: null, count: 0 });

    const { getRoutePricesAction } = await import('@/app/admin/pricing/actions');
    const result = await getRoutePricesAction({ page: 1, pageSize: 10 });

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.total).toBe(0);
      expect(result.data.totalPages).toBe(0);
    }
  });

  it('should handle database errors gracefully', async () => {
    mockRange.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' },
      count: null,
    });

    const { getRoutePricesAction } = await import('@/app/admin/pricing/actions');
    const result = await getRoutePricesAction({ page: 1, pageSize: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
