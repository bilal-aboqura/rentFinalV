import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fetchRoutePricesAction } from '@/app/admin/pricing/actions';

const mockSelect = vi.fn();
const mockRange = vi.fn();
const mockOrder = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: mockSelect,
  }),
};

// Setup mock chain
mockSelect.mockReturnValue({
  order: mockOrder,
});
mockOrder.mockReturnValue({
  range: mockRange,
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: () => {},
  }),
}));

describe('fetchRoutePricesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully fetch, paginate, and join route prices', async () => {
    const mockDbResponse = [
      {
        id: '770e8400-e29b-41d4-a716-446655440000',
        pickup_location_id: '550e8400-e29b-41d4-a716-446655440000',
        destination_location_id: '660e8400-e29b-41d4-a716-446655440000',
        price: 55.00,
        created_at: '2026-06-23T17:00:00Z',
        pickup: { name: 'Dallas City Center' },
        destination: { name: 'DFW Airport' },
      },
    ];

    mockRange.mockResolvedValue({
      data: mockDbResponse,
      error: null,
      count: 1,
    });

    const response = await fetchRoutePricesAction({ page: 1, limit: 10 });

    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
    if (response.success && response.data) {
      expect(response.data[0].id).toBe('770e8400-e29b-41d4-a716-446655440000');
      expect(response.data[0].pickupLocationName).toBe('Dallas City Center');
      expect(response.data[0].destinationLocationName).toBe('DFW Airport');
      expect(response.data[0].price).toBe(55.00);
      expect(response.totalCount).toBe(1);
    }
  });

  it('should return error status when Supabase fetch fails', async () => {
    mockRange.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const response = await fetchRoutePricesAction({ page: 1, limit: 10 });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Failed to fetch route prices: Database error');
  });
});
