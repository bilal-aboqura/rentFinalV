import { vi, describe, it, expect, beforeEach } from 'vitest';
import { updateLocationAction } from '@/app/admin/locations/actions';

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    update: mockUpdate,
  }),
};

// Setup mock chain: update -> eq -> select -> single
mockUpdate.mockReturnValue({
  eq: mockEq,
});
mockEq.mockReturnValue({
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

describe('updateLocationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update an existing location and return mapped data', async () => {
    const mockDbOutput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Houston Hobby Airport',
      type: 'Airport',
      is_active: false,
      created_at: '2026-06-23T17:00:00Z',
    };

    mockSingle.mockResolvedValue({ data: mockDbOutput, error: null });

    const response = await updateLocationAction({
      id: '550e8400-e29b-41d4-a716-446655440000',
      isActive: false,
    });

    expect(response.success).toBe(true);
    if (response.success && response.data) {
      expect(response.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(response.data.isActive).toBe(false);
      expect(response.data.name).toBe('Houston Hobby Airport');
    }
    // Only provided fields should be in the update payload
    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    expect(mockEq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440000');
  });

  it('should include name and type in the payload when provided', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'New Name',
        type: 'City',
        is_active: true,
        created_at: '2026-06-23T17:00:00Z',
      },
      error: null,
    });

    await updateLocationAction({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'New Name',
      type: 'City',
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'New Name',
      type: 'City',
    });
  });

  it('should return validation errors for an invalid id', async () => {
    const response = await updateLocationAction({
      id: 'not-a-uuid',
      name: 'Valid Name',
    });

    expect(response.success).toBe(false);
    expect(response.validationErrors).toBeDefined();
    if (response.validationErrors) {
      expect(response.validationErrors.id).toContain('Invalid ID format');
    }
  });

  it('should return validation errors when the updated name is too short', async () => {
    const response = await updateLocationAction({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'X',
    });

    expect(response.success).toBe(false);
    expect(response.validationErrors).toBeDefined();
    if (response.validationErrors) {
      expect(response.validationErrors.name).toContain(
        'Location name must be at least 2 characters long'
      );
    }
  });

  it('should return a uniqueness error when renaming to an existing name (23505)', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const response = await updateLocationAction({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Miami',
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('A location with this name already exists.');
  });

  it('should return a not-found error when the location does not exist', async () => {
    // PGRST116: JSON object requested, multiple (or no) rows returned
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'The result contains 0 rows' },
    });

    const response = await updateLocationAction({
      id: '550e8400-e29b-41d4-a716-446655440000',
      isActive: false,
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Location not found.');
  });
});
