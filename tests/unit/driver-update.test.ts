/**
 * Spec 004: Drivers Management — US3
 * Unit tests for updateDriverAction server action.
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

import { updateDriverAction } from '@/app/admin/drivers/actions';
import { createClient } from '@/lib/supabase/server';

const VALID_UUID = '880e8400-e29b-41d4-a716-446655440000';

describe('updateDriverAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return validation error for missing id', async () => {
    const result = await updateDriverAction({ name: 'New Name' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors?.id).toBeDefined();
    }
  });

  it('should return validation error for invalid UUID', async () => {
    const result = await updateDriverAction({ id: 'not-a-uuid', name: 'New Name' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors?.id).toBeDefined();
    }
  });

  it('should successfully update a driver status', async () => {
    const updatedDriver = {
      id: VALID_UUID,
      name: 'John Doe',
      phone: '+15550100111',
      availability_status: 'Inactive',
      created_at: '2026-01-01T00:00:00Z',
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updatedDriver, error: null }),
        }),
      }),
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
    } as never);

    const result = await updateDriverAction({ id: VALID_UUID, availability_status: 'Inactive' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.availability_status).toBe('Inactive');
    }
  });

  it('should return not found error when driver does not exist', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not Found' },
          }),
        }),
      }),
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
    } as never);

    const result = await updateDriverAction({ id: VALID_UUID, name: 'New Name' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Driver not found.');
    }
  });

  it('should return duplicate phone error on unique constraint violation', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'duplicate key value' },
          }),
        }),
      }),
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
    } as never);

    const result = await updateDriverAction({ id: VALID_UUID, phone: '+15550100222' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('A driver with this phone number is already registered.');
    }
  });
});
