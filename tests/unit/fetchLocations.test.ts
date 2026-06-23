import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fetchLocations } from '@/app/admin/locations/data';

// Mock query builder chain: select -> [ilike] -> order -> range
const mockRange = vi.fn();
const mockOrder = vi.fn().mockReturnThis();
const mockIlike = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnValue({
  ilike: mockIlike,
  order: mockOrder,
  range: mockRange,
});

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: mockSelect,
  }),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: () => {},
  }),
}));

const sampleRows = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Dallas/Fort Worth Airport',
    type: 'Airport',
    is_active: true,
    created_at: '2026-06-23T17:00:00Z',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440000',
    name: 'Austin City',
    type: 'City',
    is_active: false,
    created_at: '2026-06-23T18:00:00Z',
  },
];

describe('fetchLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockReturnThis();
    mockIlike.mockReturnThis();
  });

  it('should fetch a paginated list of locations with correct mapping and total count', async () => {
    mockRange.mockResolvedValue({ data: sampleRows, error: null, count: 2 });

    const response = await fetchLocations({ page: 1, limit: 10 });

    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(2);
    if (response.success && response.data) {
      expect(response.data[0].id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(response.data[0].name).toBe('Dallas/Fort Worth Airport');
      expect(response.data[0].type).toBe('Airport');
      expect(response.data[0].isActive).toBe(true);
      expect(response.data[1].isActive).toBe(false);
    }
    expect(response.totalCount).toBe(2);
    // Pagination range for page 1, limit 10 is [0, 9]
    expect(mockRange).toHaveBeenCalledWith(0, 9);
    // No search query => ilike should NOT be called
    expect(mockIlike).not.toHaveBeenCalled();
  });

  it('should apply case-insensitive ilike search filter when a query is provided', async () => {
    mockRange.mockResolvedValue({
      data: [sampleRows[0]],
      error: null,
      count: 1,
    });

    const response = await fetchLocations({ page: 1, limit: 10, query: 'Dallas' });

    expect(response.success).toBe(true);
    expect(mockIlike).toHaveBeenCalledWith('name', '%Dallas%');
    expect(response.data).toHaveLength(1);
  });

  it('should sanitize special LIKE wildcard characters in the search query', async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });

    await fetchLocations({ page: 1, limit: 10, query: '50%_off*' });

    // %, _, * must be escaped/removed so they are treated as literals, not wildcards.
    // User-supplied % -> \%, _ -> \_, * removed; wrapped with surrounding % wildcards.
    expect(mockIlike).toHaveBeenCalledWith('name', '%50\\%\\_off%');
  });

  it('should compute correct range bounds for page 2', async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 15 });

    await fetchLocations({ page: 2, limit: 10 });

    // Page 2 => [10, 19]
    expect(mockRange).toHaveBeenCalledWith(10, 19);
  });

  it('should return an error response when Supabase fetch fails', async () => {
    mockRange.mockResolvedValue({ data: null, error: { message: 'Database error' } });

    const response = await fetchLocations({ page: 1, limit: 10 });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Failed to fetch locations: Database error');
  });

  it('should return an empty list when no locations exist', async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });

    const response = await fetchLocations({ page: 1, limit: 10 });

    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(0);
    expect(response.totalCount).toBe(0);
  });
});
