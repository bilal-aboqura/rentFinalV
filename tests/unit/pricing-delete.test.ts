import { vi, describe, it, expect, beforeEach } from 'vitest';
import { deleteRoutePriceAction } from '@/app/admin/pricing/actions';

const mockDelete = vi.fn();
const mockEq = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    delete: mockDelete,
  }),
};

// Setup mock chain
mockDelete.mockReturnValue({
  eq: mockEq,
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

describe('deleteRoutePriceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully delete an existing pricing rule', async () => {
    mockEq.mockResolvedValue({
      error: null,
    });

    const response = await deleteRoutePriceAction('770e8400-e29b-41d4-a716-446655440000');

    expect(response.success).toBe(true);
    if (response.success && response.data) {
      expect(response.data.id).toBe('770e8400-e29b-41d4-a716-446655440000');
    }
  });

  it('should return error when Supabase delete fails', async () => {
    mockEq.mockResolvedValue({
      error: { message: 'Database delete failed' },
    });

    const response = await deleteRoutePriceAction('770e8400-e29b-41d4-a716-446655440000');

    expect(response.success).toBe(false);
    expect(response.error).toBe('Database delete failed');
  });
});
