/**
 * T026 [US3] - Vitest integration tests for updateLocationAction.
 * Written FIRST following TDD.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ----------------------------------------------------------------
// Supabase mock
// ----------------------------------------------------------------
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

const mockFrom = vi.fn(() => ({
  update: mockUpdate.mockReturnThis(),
  select: mockSelect.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
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

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('[US3] updateLocationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates a location name with a valid partial payload', async () => {
    const updated = {
      id: VALID_UUID,
      name: 'Manchester Airport',
      type: 'Airport',
      is_active: true,
      created_at: '2026-06-01T00:00:00Z',
    };
    mockSingle.mockResolvedValue({ data: updated, error: null });

    const { updateLocationAction } = await import('@/app/admin/locations/actions');
    const result = await updateLocationAction({ id: VALID_UUID, name: 'Manchester Airport' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.name).toBe('Manchester Airport');
    }
  });

  it('updates only the isActive flag', async () => {
    const updated = {
      id: VALID_UUID,
      name: 'London',
      type: 'City',
      is_active: false,
      created_at: '2026-06-01T00:00:00Z',
    };
    mockSingle.mockResolvedValue({ data: updated, error: null });

    const { updateLocationAction } = await import('@/app/admin/locations/actions');
    const result = await updateLocationAction({ id: VALID_UUID, isActive: false });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.is_active).toBe(false);
    }
  });

  it('returns a validation error for an invalid UUID', async () => {
    const { updateLocationAction } = await import('@/app/admin/locations/actions');
    const result = await updateLocationAction({ id: 'not-a-uuid', name: 'London' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors).toBeDefined();
    }
  });

  it('returns a duplicate name error on unique constraint violation', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const { updateLocationAction } = await import('@/app/admin/locations/actions');
    const result = await updateLocationAction({ id: VALID_UUID, name: 'Existing Name' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('already exists');
    }
  });

  it('returns a not-found error when record does not exist', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } });

    const { updateLocationAction } = await import('@/app/admin/locations/actions');
    const result = await updateLocationAction({ id: VALID_UUID, name: 'Ghost' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
