/**
 * Spec 004: Drivers Management — US2
 * Unit tests for createDriverAction server action.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Supabase server client
// ---------------------------------------------------------------------------
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

import { createDriverAction } from '@/app/admin/drivers/actions';
import { createClient } from '@/lib/supabase/server';

describe('createDriverAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return validation errors for missing name', async () => {
    const result = await createDriverAction({ phone: '+15550100111' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.name).toBeDefined();
    }
  });

  it('should return validation errors for phone too short', async () => {
    const result = await createDriverAction({ name: 'Valid Name', phone: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.phone).toBeDefined();
    }
  });

  it('should succeed and insert new driver', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'abc-123',
            name: 'Alice Smith',
            phone: '+15550100200',
            availability_status: 'Available',
            created_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        }),
      }),
    });

    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-123' } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);

    const result = await createDriverAction({
      name: 'Alice Smith',
      phone: '+15550100200',
      availability_status: 'Available',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Alice Smith');
      expect(result.data.phone).toBe('+15550100200');
    }
  });

  it('should return duplicate phone error on unique constraint violation', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key value' },
        }),
      }),
    });

    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-123' } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);

    const result = await createDriverAction({
      name: 'Jane Smith',
      phone: '+15550100111',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('A driver with this phone number is already registered.');
    }
  });
});
