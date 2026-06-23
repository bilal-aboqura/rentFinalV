import { vi, describe, it, expect, beforeEach } from 'vitest';
import { deleteDriverAction } from '@/app/admin/drivers/actions';

const mockDelete = vi.fn();
const mockEq = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    delete: mockDelete,
  }),
};

// Chain setup
mockDelete.mockReturnValue({
  eq: mockEq,
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: () => {},
  }),
}));

describe('deleteDriverAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully delete an existing driver', async () => {
    mockEq.mockResolvedValue({
      error: null,
    });

    const response = await deleteDriverAction('880e8400-e29b-41d4-a716-446655440000');

    expect(response.success).toBe(true);
    if (response.success && response.data) {
      expect(response.data.id).toBe('880e8400-e29b-41d4-a716-446655440000');
    }
  });

  it('should return error when Supabase deletion fails', async () => {
    mockEq.mockResolvedValue({
      error: { message: 'Database delete failed' },
    });

    const response = await deleteDriverAction('880e8400-e29b-41d4-a716-446655440000');

    expect(response.success).toBe(false);
    expect(response.error).toBe('Database delete failed');
  });
});
