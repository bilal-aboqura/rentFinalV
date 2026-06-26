import { vi, describe, it, expect, beforeEach } from 'vitest';
import { deleteLocationAction } from '@/app/admin/locations/actions';

const mockBookingsSelect = vi.fn();
const mockBookingsOr = vi.fn();
const mockRoutePricesSelect = vi.fn();
const mockRoutePricesOr = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'bookings') {
      return { select: mockBookingsSelect };
    }

    if (table === 'route_prices') {
      return { select: mockRoutePricesSelect };
    }

    return { delete: mockDelete };
  }),
};

mockBookingsSelect.mockReturnValue({ or: mockBookingsOr });
mockRoutePricesSelect.mockReturnValue({ or: mockRoutePricesOr });
mockDelete.mockReturnValue({ eq: mockEq });

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: () => {},
  }),
}));

describe('deleteLocationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookingsOr.mockResolvedValue({ count: 0, error: null });
    mockRoutePricesOr.mockResolvedValue({ count: 0, error: null });
    mockEq.mockResolvedValue({ error: null });
  });

  it('should successfully delete an unused location', async () => {
    const locationId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await deleteLocationAction(locationId);

    expect(response.success).toBe(true);
    expect(response.data).toEqual({ id: locationId });
    expect(mockBookingsOr).toHaveBeenCalledWith(
      `pickup_location_id.eq.${locationId},destination_location_id.eq.${locationId}`
    );
    expect(mockRoutePricesOr).toHaveBeenCalledWith(
      `pickup_location_id.eq.${locationId},destination_location_id.eq.${locationId}`
    );
    expect(mockEq).toHaveBeenCalledWith('id', locationId);
  });

  it('should block deletion when the location is referenced by bookings', async () => {
    mockBookingsOr.mockResolvedValue({ count: 1, error: null });

    const response = await deleteLocationAction('550e8400-e29b-41d4-a716-446655440000');

    expect(response.success).toBe(false);
    expect(response.error).toBe(
      'Cannot delete this location because it is currently referenced by booking records or pricing rules. Consider deactivating it instead.'
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should block deletion when the location is referenced by pricing rules', async () => {
    mockRoutePricesOr.mockResolvedValue({ count: 1, error: null });

    const response = await deleteLocationAction('550e8400-e29b-41d4-a716-446655440000');

    expect(response.success).toBe(false);
    expect(response.error).toBe(
      'Cannot delete this location because it is currently referenced by booking records or pricing rules. Consider deactivating it instead.'
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should return validation errors for an invalid id', async () => {
    const response = await deleteLocationAction('not-a-uuid');

    expect(response.success).toBe(false);
    expect(response.validationErrors?.id).toContain('Invalid ID format');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should return error when Supabase delete fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Database delete failed' } });

    const response = await deleteLocationAction('550e8400-e29b-41d4-a716-446655440000');

    expect(response.success).toBe(false);
    expect(response.error).toBe('Database delete failed');
  });
});
