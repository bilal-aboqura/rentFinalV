import { vi, describe, it, expect, beforeEach } from 'vitest';
import { updateDriverAction } from '@/app/admin/drivers/actions';

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    update: mockUpdate,
  }),
};

// Chain setup
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

describe('updateDriverAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update an existing driver', async () => {
    const mockInput = {
      id: '880e8400-e29b-41d4-a716-446655440000',
      name: 'Alice Smith Updated',
      availability_status: 'Busy',
    };

    const mockDbOutput = {
      id: '880e8400-e29b-41d4-a716-446655440000',
      name: 'Alice Smith Updated',
      phone: '+15551234567',
      availability_status: 'Busy',
      created_at: '2026-06-23T18:00:00Z',
    };

    mockSingle.mockResolvedValue({
      data: mockDbOutput,
      error: null,
    });

    const response = await updateDriverAction(mockInput);

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    if (response.success && response.data) {
      expect(response.data.name).toBe('Alice Smith Updated');
      expect(response.data.availability_status).toBe('Busy');
    }
  });

  it('should return error when driver is not found', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await updateDriverAction({
      id: '880e8400-e29b-41d4-a716-446655440000',
      name: 'Non Existent',
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Driver not found.');
  });

  it('should return validation error for invalid ID format', async () => {
    const response = await updateDriverAction({
      id: 'invalid-uuid-format',
      name: 'New Name',
    });

    expect(response.success).toBe(false);
    expect(response.validationErrors).toBeDefined();
    if (response.validationErrors) {
      expect(response.validationErrors.id).toContain('Invalid ID format');
    }
  });

  it('should return error on duplicate phone number during update', async () => {
    const mockInput = {
      id: '880e8400-e29b-41d4-a716-446655440000',
      phone: '1234567890',
    };

    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const response = await updateDriverAction(mockInput);

    expect(response.success).toBe(false);
    expect(response.error).toBe('A driver with this phone number is already registered.');
  });
});
