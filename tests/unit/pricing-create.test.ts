import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRoutePriceAction } from '@/app/admin/pricing/actions';

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    insert: mockInsert,
  }),
};

// Setup mock chain
mockInsert.mockReturnValue({
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

describe('createRoutePriceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a pricing rule', async () => {
    const mockDbInput = {
      pickupLocationId: '550e8400-e29b-41d4-a716-446655440000',
      destinationLocationId: '660e8400-e29b-41d4-a716-446655440000',
      price: 55.00,
    };

    const mockDbOutput = {
      id: '770e8400-e29b-41d4-a716-446655440000',
      pickup_location_id: '550e8400-e29b-41d4-a716-446655440000',
      destination_location_id: '660e8400-e29b-41d4-a716-446655440000',
      price: 55.00,
      created_at: '2026-06-23T17:00:00Z',
    };

    mockSingle.mockResolvedValue({
      data: mockDbOutput,
      error: null,
    });

    const response = await createRoutePriceAction(mockDbInput);

    expect(response.success).toBe(true);
    if (response.success && response.data) {
      expect(response.data.id).toBe('770e8400-e29b-41d4-a716-446655440000');
      expect(response.data.price).toBe(55.00);
    }
  });

  it('should return validation errors for invalid inputs', async () => {
    const response = await createRoutePriceAction({
      pickupLocationId: 'invalid-id',
      destinationLocationId: '660e8400-e29b-41d4-a716-446655440000',
      price: -10,
    });

    expect(response.success).toBe(false);
    expect(response.validationErrors).toBeDefined();
    if (response.validationErrors) {
      expect(response.validationErrors.pickupLocationId).toContain('Invalid pickup location ID format');
      expect(response.validationErrors.price).toContain('Price must be a positive number greater than zero');
    }
  });

  it('should return error when duplicate route is created (unique constraint violation)', async () => {
    const mockDbInput = {
      pickupLocationId: '550e8400-e29b-41d4-a716-446655440000',
      destinationLocationId: '660e8400-e29b-41d4-a716-446655440000',
      price: 55.00,
    };

    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const response = await createRoutePriceAction(mockDbInput);

    expect(response.success).toBe(false);
    expect(response.error).toBe('A pricing rule for this route already exists.');
  });
});
