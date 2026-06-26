import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createLocationAction } from '@/app/admin/locations/actions';

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    insert: mockInsert,
  }),
};

// Setup mock chain: insert -> select -> single
mockInsert.mockReturnValue({
  select: mockSelect,
});
mockSelect.mockReturnValue({
  single: mockSingle,
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

describe('createLocationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a new location and return mapped Location data', async () => {
    const mockDbOutput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Boston Logan Airport',
      type: 'Airport',
      is_active: true,
      created_at: '2026-06-23T17:00:00Z',
    };

    mockSingle.mockResolvedValue({ data: mockDbOutput, error: null });

    const response = await createLocationAction({
      name: 'Boston Logan Airport',
      type: 'Airport',
      isActive: true,
    });

    expect(response.success).toBe(true);
    if (response.success && response.data) {
      expect(response.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(response.data.name).toBe('Boston Logan Airport');
      expect(response.data.type).toBe('Airport');
      expect(response.data.isActive).toBe(true);
      expect(response.data.createdAt).toBe('2026-06-23T17:00:00Z');
    }
    // Verify the insert payload uses snake_case columns
    expect(mockInsert).toHaveBeenCalledWith({
      name: 'Boston Logan Airport',
      type: 'Airport',
      is_active: true,
    });
  });

  it('should default isActive to true when not provided', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Austin',
        type: 'City',
        is_active: true,
        created_at: '2026-06-23T17:00:00Z',
      },
      error: null,
    });

    await createLocationAction({ name: 'Austin', type: 'City' });

    expect(mockInsert).toHaveBeenCalledWith({
      name: 'Austin',
      type: 'City',
      is_active: true,
    });
  });

  it('should return validation errors when name is too short', async () => {
    const response = await createLocationAction({
      name: 'A', // too short
      type: 'City',
    });

    expect(response.success).toBe(false);
    expect(response.validationErrors).toBeDefined();
    if (response.validationErrors) {
      expect(response.validationErrors.name).toContain('Location name must be at least 2 characters long');
    }
  });

  it('should return validation errors for an invalid location type', async () => {
    const response = await createLocationAction({
      name: 'Valid Name',
      type: 'State' as never,
    });

    expect(response.success).toBe(false);
    expect(response.validationErrors).toBeDefined();
  });

  it('should return a uniqueness error when a duplicate name is created (case-insensitive constraint)', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const response = await createLocationAction({
      name: 'Miami',
      type: 'City',
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('A location with this name already exists.');
  });

  it('should return a generic error for other database failures', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation does not exist' },
    });

    const response = await createLocationAction({
      name: 'Seattle',
      type: 'City',
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('relation does not exist');
  });
});
