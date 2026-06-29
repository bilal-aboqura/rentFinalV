/**
 * Spec 004: Drivers Management — US4
 * Unit tests for deleteDriverAction server action.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null,
      }),
    },
    from: vi.fn(),
  }),
}));

import { deleteDriverAction } from '@/app/admin/drivers/actions';
import { createClient } from '@/lib/supabase/server';

const VALID_UUID = '880e8400-e29b-41d4-a716-446655440000';

describe('deleteDriverAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully delete an existing driver', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null, count: 1 }),
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({ delete: mockDelete }),
    } as never);

    const result = await deleteDriverAction(VALID_UUID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(VALID_UUID);
    }
  });

  it('should return error when driver is not found (count === 0)', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null, count: 0 }),
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({ delete: mockDelete }),
    } as never);

    const result = await deleteDriverAction(VALID_UUID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed to delete driver');
    }
  });

  it('should return error when empty id provided', async () => {
    const result = await deleteDriverAction('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Driver ID is required.');
    }
  });
});
