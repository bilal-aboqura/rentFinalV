/**
 * T021 [US2] - Vitest integration tests for createLocationAction.
 * Written FIRST following TDD.
 * Mocks Supabase to verify action logic in isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ----------------------------------------------------------------
// Supabase mock
// ----------------------------------------------------------------
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();

const mockFrom = vi.fn(() => ({
  insert: mockInsert.mockReturnThis(),
  select: mockSelect.mockReturnThis(),
  single: mockSingle,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null }),
    },
  })),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('[US2] createLocationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a location with valid input and returns the new record', async () => {
    const newLocation = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'London Heathrow',
      type: 'Airport',
      is_active: true,
      created_at: '2026-06-01T00:00:00Z',
    };
    mockSingle.mockResolvedValue({ data: newLocation, error: null });

    const { createLocationAction } = await import('@/app/admin/locations/actions');
    const result = await createLocationAction({ name: 'London Heathrow', type: 'Airport', isActive: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.name).toBe('London Heathrow');
    }
  });

  it('assigns default isActive=true when not provided', async () => {
    const newLocation = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Berlin',
      type: 'City',
      is_active: true,
      created_at: '2026-06-01T00:00:00Z',
    };
    mockSingle.mockResolvedValue({ data: newLocation, error: null });

    const { createLocationAction } = await import('@/app/admin/locations/actions');
    const result = await createLocationAction({ name: 'Berlin', type: 'City' });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true })
    );
  });

  it('returns validation error for name that is too short', async () => {
    const { createLocationAction } = await import('@/app/admin/locations/actions');
    const result = await createLocationAction({ name: 'A', type: 'City' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors).toBeDefined();
    }
  });

  it('returns validation error for invalid type', async () => {
    const { createLocationAction } = await import('@/app/admin/locations/actions');
    const result = await createLocationAction({ name: 'London', type: 'invalid' });

    expect(result.success).toBe(false);
  });

  it('returns a duplicate name error when Supabase returns a unique constraint violation', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const { createLocationAction } = await import('@/app/admin/locations/actions');
    const result = await createLocationAction({ name: 'London Heathrow', type: 'Airport' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('already exists');
    }
  });

  it('returns a generic error when the database fails', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '500', message: 'Internal server error' },
    });

    const { createLocationAction } = await import('@/app/admin/locations/actions');
    const result = await createLocationAction({ name: 'Valid Name', type: 'City' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
