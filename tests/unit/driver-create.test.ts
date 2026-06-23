import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createDriverAction } from '@/app/admin/drivers/actions';

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    insert: mockInsert,
  }),
};

// Chain setup
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

describe('createDriverAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a new driver with normalized phone', async () => {
    const mockInput = {
      name: 'Alice Smith',
      phone: '+1 (555) 123-4567',
      availability_status: 'Available',
    };

    const mockDbOutput = {
      id: '880e8400-e29b-41d4-a716-446655440000',
      name: 'Alice Smith',
      phone: '+15551234567', // Normalized
      availability_status: 'Available',
      created_at: '2026-06-23T18:00:00Z',
    };

    mockSingle.mockResolvedValue({
      data: mockDbOutput,
      error: null,
    });

    const response = await createDriverAction(mockInput);

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    if (response.success && response.data) {
      expect(response.data.id).toBe('880e8400-e29b-41d4-a716-446655440000');
      expect(response.data.phone).toBe('+15551234567');
    }
  });

  it('should return validation errors for invalid inputs', async () => {
    const response = await createDriverAction({
      name: 'A', // too short
      phone: '123', // too short
      availability_status: 'Available',
    });

    expect(response.success).toBe(false);
    expect(response.validationErrors).toBeDefined();
    if (response.validationErrors) {
      expect(response.validationErrors.name).toContain('Name must be at least 2 characters long');
      expect(response.validationErrors.phone).toContain('Phone number must be at least 10 characters long');
    }
  });

  it('should return error on duplicate phone number (unique constraint violation)', async () => {
    const mockInput = {
      name: 'Alice Smith',
      phone: '1234567890',
      availability_status: 'Available',
    };

    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const response = await createDriverAction(mockInput);

    expect(response.success).toBe(false);
    expect(response.error).toBe('A driver with this phone number is already registered.');
  });
});
