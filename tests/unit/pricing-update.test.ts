import { vi, describe, it, expect, beforeEach } from 'vitest';
import { updateRoutePriceAction } from '@/app/admin/pricing/actions';

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    update: mockUpdate,
  }),
};

// Setup mock chain
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

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: () => {},
  }),
}));

describe('updateRoutePriceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update an existing pricing rule', async () => {
    const mockDbInput = {
      id: '770e8400-e29b-41d4-a716-446655440000',
      price: 65.00,
    };

    const mockDbOutput = {
      id: '770e8400-e29b-41d4-a716-446655440000',
      pickup_location_id: '550e8400-e29b-41d4-a716-446655440000',
      destination_location_id: '660e8400-e29b-41d4-a716-446655440000',
      price: 65.00,
      created_at: '2026-06-23T17:00:00Z',
    };

    mockSingle.mockResolvedValue({
      data: mockDbOutput,
      error: null,
    });

    const response = await updateRoutePriceAction(mockDbInput);

    expect(response.success).toBe(true);
    if (response.success && response.data) {
      expect(response.data.id).toBe('770e8400-e29b-41d4-a716-446655440000');
      expect(response.data.price).toBe(65.00);
    }
  });

  it('should return validation errors for invalid inputs', async () => {
    const response = await updateRoutePriceAction({
      id: 'invalid-id',
      price: -5,
    });

    expect(response.success).toBe(false);
    expect(response.validationErrors).toBeDefined();
    if (response.validationErrors) {
      expect(response.validationErrors.id).toContain('Invalid ID format');
      expect(response.validationErrors.price).toContain('Price must be a positive number greater than zero');
    }
  });

  it('should return validation errors when no editable fields are supplied', async () => {
    const response = await updateRoutePriceAction({
      id: '770e8400-e29b-41d4-a716-446655440000',
    });

    expect(response.success).toBe(false);
    expect(response.validationErrors?.form).toContain('At least one pricing field must be provided');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should return error when duplicate route is created during update (unique constraint violation)', async () => {
    const mockDbInput = {
      id: '770e8400-e29b-41d4-a716-446655440000',
      pickupLocationId: '550e8400-e29b-41d4-a716-446655440000',
      destinationLocationId: '660e8400-e29b-41d4-a716-446655440000',
    };

    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const response = await updateRoutePriceAction(mockDbInput);

    expect(response.success).toBe(false);
    expect(response.error).toBe('A pricing rule for this route already exists.');
  });
});
