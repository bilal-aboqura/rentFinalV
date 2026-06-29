/**
 * T011 [US1] - Vitest unit/integration tests for fetching and searching locations.
 * Written FIRST following TDD.
 * Mocks Supabase to test the data-fetching logic in isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ----------------------------------------------------------------
// Mock: @supabase/ssr and server client
// ----------------------------------------------------------------
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockIlike = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();

const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      }),
    },
  })),
}));

// ----------------------------------------------------------------
// Mock next/cache
// ----------------------------------------------------------------
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function buildMockChain(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: mockSelect.mockReturnThis(),
    ilike: mockIlike.mockReturnThis(),
    order: mockOrder.mockReturnThis(),
    range: mockRange,
    eq: mockEq.mockReturnThis(),
  };
  return { ...chain, ...overrides };
}

const mockLocations = [
  { id: '1', name: 'Amsterdam', type: 'City', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: '2', name: 'Amsterdam Schiphol', type: 'Airport', is_active: true, created_at: '2026-01-02T00:00:00Z' },
  { id: '3', name: 'Central Bus Station', type: 'Pickup Point', is_active: false, created_at: '2026-01-03T00:00:00Z' },
];

describe('[US1] fetchLocations – Paginated Fetching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all locations with default pagination', async () => {
    mockFrom.mockReturnValue(buildMockChain({
      range: mockRange.mockResolvedValue({ data: mockLocations, count: 3, error: null }),
    }));

    const { getLocationsData } = await import('@/app/admin/locations/data');
    const result = await getLocationsData({ page: 1, pageSize: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locations).toHaveLength(3);
      expect(result.data.total).toBe(3);
    }
  });

  it('applies case-insensitive search filter when provided', async () => {
    const filtered = [mockLocations[0], mockLocations[1]];
    mockFrom.mockReturnValue(buildMockChain({
      range: mockRange.mockResolvedValue({ data: filtered, count: 2, error: null }),
    }));

    const { getLocationsData } = await import('@/app/admin/locations/data');
    const result = await getLocationsData({ search: 'amsterdam', page: 1, pageSize: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locations).toHaveLength(2);
      expect(result.data.total).toBe(2);
    }
  });

  it('applies correct range for page 2', async () => {
    mockFrom.mockReturnValue(buildMockChain({
      range: mockRange.mockResolvedValue({ data: [], count: 0, error: null }),
    }));

    const { getLocationsData } = await import('@/app/admin/locations/data');
    await getLocationsData({ page: 2, pageSize: 10 });

    expect(mockRange).toHaveBeenCalledWith(10, 19);
  });

  it('returns error when Supabase query fails', async () => {
    mockFrom.mockReturnValue(buildMockChain({
      range: mockRange.mockResolvedValue({ data: null, count: null, error: { message: 'DB error' } }),
    }));

    const { getLocationsData } = await import('@/app/admin/locations/data');
    const result = await getLocationsData({ page: 1, pageSize: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('DB error');
    }
  });
});
