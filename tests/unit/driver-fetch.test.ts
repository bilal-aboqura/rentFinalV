import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fetchDriversAction } from '@/app/admin/drivers/actions';

const mockQueryBuilder: {
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
} = {
  or: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
};

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue(mockQueryBuilder),
  }),
};

// Chain setup
mockQueryBuilder.or.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: () => {},
  }),
}));

describe('fetchDriversAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder.or.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.range.mockReset();
  });

  it('should successfully fetch list of drivers with pagination', async () => {
    const mockDriversList = [
      {
        id: '880e8400-e29b-41d4-a716-446655440000',
        name: 'Alice Smith',
        phone: '+15550100200',
        availability_status: 'Available',
        created_at: '2026-06-23T18:00:00Z',
      },
    ];

    mockQueryBuilder.range.mockResolvedValue({
      data: mockDriversList,
      error: null,
      count: 1,
    });

    const response = await fetchDriversAction({ page: 1, limit: 10 });

    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
    if (response.success && response.data) {
      expect(response.data[0].name).toBe('Alice Smith');
      expect(response.data[0].phone).toBe('+15550100200');
      expect(response.totalCount).toBe(1);
    }
  });

  it('should filter drivers when search query is provided', async () => {
    mockQueryBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    await fetchDriversAction({ page: 1, limit: 10, search: 'Alice' });

    expect(mockQueryBuilder.or).toHaveBeenCalledWith('name.ilike.%Alice%,phone.ilike.%Alice%');
  });

  it('should return error when Supabase query fails', async () => {
    mockQueryBuilder.range.mockResolvedValue({
      data: null,
      error: { message: 'Supabase select failed' },
    });

    const response = await fetchDriversAction({ page: 1, limit: 10 });

    expect(response.success).toBe(false);
    expect(response.error).toContain('Failed to fetch drivers: Supabase select failed');
  });
});
