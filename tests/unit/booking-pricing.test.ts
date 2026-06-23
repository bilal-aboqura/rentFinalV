import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getRoutePriceAction } from '@/app/admin/pricing/actions';

const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: mockEq,
    }),
  }),
};

// Setup mock chain
mockEq.mockReturnValue({
  eq: mockEq, // Support chaining multiple .eq() calls
  maybeSingle: mockMaybeSingle,
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

describe('getRoutePriceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the correct price when it exists', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { price: 75.00 },
      error: null,
    });

    const response = await getRoutePriceAction(
      '550e8400-e29b-41d4-a716-446655440000',
      '660e8400-e29b-41d4-a716-446655440000'
    );

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.price).toBe(75.00);
    }
  });

  it('should return null price when no rule exists', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await getRoutePriceAction(
      '550e8400-e29b-41d4-a716-446655440000',
      '660e8400-e29b-41d4-a716-446655440000'
    );

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.price).toBeNull();
    }
  });

  it('should return error when Supabase select fails', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database fetch failed' },
    });

    const response = await getRoutePriceAction(
      '550e8400-e29b-41d4-a716-446655440000',
      '660e8400-e29b-41d4-a716-446655440000'
    );

    expect(response.success).toBe(false);
    expect(response.error).toBe('Database fetch failed');
  });
});
