/**
 * Spec 004: Drivers Management — US1
 * Unit tests for database fetching, search filtering, and pagination.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock next/cache to avoid revalidatePath invariant errors
// ---------------------------------------------------------------------------
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock Supabase server client (factory must not use top-level variables)
// ---------------------------------------------------------------------------
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { fetchDriversAction } from '@/app/admin/drivers/actions';
import { createClient } from '@/lib/supabase/server';

function buildSupabaseMock(rangeResult: { data: unknown[]; error: unknown; count: number }) {
  const range = vi.fn().mockResolvedValue(rangeResult);
  const or = vi.fn();
  const order = vi.fn();
  const select = vi.fn();

  // Chain: select -> order -> or -> range
  select.mockReturnValue({ order, or, range });
  order.mockReturnValue({ or, range });
  or.mockImplementation(() => ({ range }));

  const from = vi.fn().mockReturnValue({ select });

  return {
    supabaseMock: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-123' } },
          error: null,
        }),
      },
      from,
    },
    mocks: { from, select, order, or, range },
  };
}

describe('fetchDriversAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return drivers with default pagination', async () => {
    const mockDrivers = [
      { id: '1', name: 'John Doe', phone: '+15550100111', availability_status: 'Available', created_at: '2026-01-01T00:00:00Z' },
      { id: '2', name: 'Bob Miller', phone: '+15550100222', availability_status: 'Busy', created_at: '2026-01-02T00:00:00Z' },
    ];

    const { supabaseMock } = buildSupabaseMock({ data: mockDrivers, error: null, count: 2 });
    vi.mocked(createClient).mockResolvedValue(supabaseMock as never);

    const result = await fetchDriversAction({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(result.data.page).toBe(1);
      expect(result.data.totalPages).toBe(1);
    }
  });

  it('should apply case-insensitive search by name', async () => {
    const { supabaseMock, mocks } = buildSupabaseMock({ data: [], error: null, count: 0 });
    vi.mocked(createClient).mockResolvedValue(supabaseMock as never);

    await fetchDriversAction({ search: 'miller' });
    expect(mocks.or).toHaveBeenCalledWith(expect.stringContaining('miller'));
  });

  it('should apply pagination with limit and offset', async () => {
    const { supabaseMock, mocks } = buildSupabaseMock({ data: [], error: null, count: 0 });
    vi.mocked(createClient).mockResolvedValue(supabaseMock as never);

    await fetchDriversAction({ page: 2, pageSize: 5 });
    // Page 2 with pageSize 5: range(5, 9)
    expect(mocks.range).toHaveBeenCalledWith(5, 9);
  });
});
