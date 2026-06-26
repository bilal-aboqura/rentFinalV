import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  fetchBookingsAction,
  updateBookingStatusAction,
  assignDriverAction,
} from '@/app/admin/bookings/actions';

// Mock database results
let mockRangeData: Record<string, unknown>[] = [];
let mockRangeError: { message: string } | null = null;
let mockRangeCount = 0;

const mockSingle = vi.fn();
const mockUpdate = vi.fn();

interface SupabaseChain {
  select: () => SupabaseChain;
  eq: () => SupabaseChain;
  order: () => SupabaseChain;
  range: () => Promise<{ data: Record<string, unknown>[]; error: { message: string } | null; count: number }>;
  update: (val: unknown) => SupabaseChain;
  single: () => Promise<unknown>;
}

// Create dynamic supabase mock chain
const mockSupabaseChain: SupabaseChain = {
  select: vi.fn().mockImplementation(() => mockSupabaseChain),
  eq: vi.fn().mockImplementation(() => mockSupabaseChain),
  order: vi.fn().mockImplementation(() => mockSupabaseChain),
  range: vi.fn().mockImplementation(() => {
    return Promise.resolve({ data: mockRangeData, error: mockRangeError, count: mockRangeCount });
  }),
  update: vi.fn().mockImplementation((val) => {
    mockUpdate(val);
    return mockSupabaseChain;
  }),
  single: vi.fn().mockImplementation(() => mockSingle()),
};

const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'bookings') {
      return mockSupabaseChain;
    }
    return {};
  }),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: () => {},
  }),
}));

describe('Admin Bookings Dashboard Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRangeData = [];
    mockRangeError = null;
    mockRangeCount = 0;
  });

  describe('fetchBookingsAction', () => {
    it('should successfully fetch, paginate, and join locations/drivers', async () => {
      mockRangeData = [
        {
          id: 'b1-uuid',
          booking_reference: 'ref-1',
          customer_name: 'John Doe',
          price: 50.0,
          status: 'Pending',
          created_at: '2026-06-26T03:00:00Z',
          pickup: { name: 'Airport' },
          destination: { name: 'Hotel' },
          driver: null,
        },
      ];
      mockRangeCount = 1;

      const res = await fetchBookingsAction({ page: 1, limit: 10 });
      expect(res.success).toBe(true);
      if (res.success && res.data) {
        expect(res.data.bookings).toHaveLength(1);
        expect(res.data.bookings[0].customer_name).toBe('John Doe');
        expect(res.data.totalCount).toBe(1);
      }
    });

    it('should return error if fetching bookings fails', async () => {
      mockRangeError = { message: 'Database failure' };
      const res = await fetchBookingsAction({ page: 1, limit: 10 });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Database failure');
    });
  });

  describe('updateBookingStatusAction', () => {
    const bookingId = '550e8400-e29b-41d4-a716-446655440000';

    it('should successfully update status of a Pending booking', async () => {
      // Mock lookup: current status is 'Pending'
      mockSingle.mockResolvedValueOnce({
        data: { status: 'Pending' },
        error: null,
      });

      // Mock update query
      mockSingle.mockResolvedValueOnce({
        data: { id: bookingId, status: 'Confirmed' },
        error: null,
      });

      const res = await updateBookingStatusAction({ bookingId, status: 'Confirmed' });
      expect(res.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'Confirmed' });
    });

    it('should reject status changes when the current status is Completed', async () => {
      // Mock lookup: current status is 'Completed'
      mockSingle.mockResolvedValueOnce({
        data: { status: 'Completed' },
        error: null,
      });

      const res = await updateBookingStatusAction({ bookingId, status: 'Confirmed' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('terminal state');
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should reject status changes when the current status is Cancelled', async () => {
      // Mock lookup: current status is 'Cancelled'
      mockSingle.mockResolvedValueOnce({
        data: { status: 'Cancelled' },
        error: null,
      });

      const res = await updateBookingStatusAction({ bookingId, status: 'Pending' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('terminal state');
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('assignDriverAction', () => {
    const bookingId = '550e8400-e29b-41d4-a716-446655440000';
    const driverId = '880e8400-e29b-41d4-a716-446655440000';

    it('should successfully assign a driver to a Confirmed booking', async () => {
      // Mock lookup: current status is 'Confirmed'
      mockSingle.mockResolvedValueOnce({
        data: { status: 'Confirmed' },
        error: null,
      });

      // Mock update query
      mockSingle.mockResolvedValueOnce({
        data: { id: bookingId, status: 'Confirmed', driver_id: driverId },
        error: null,
      });

      const res = await assignDriverAction({ bookingId, driverId });
      expect(res.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ driver_id: driverId });
    });

    it('should reject driver assignment when the booking is in a terminal state (Completed)', async () => {
      // Mock lookup: current status is 'Completed'
      mockSingle.mockResolvedValueOnce({
        data: { status: 'Completed' },
        error: null,
      });

      const res = await assignDriverAction({ bookingId, driverId });
      expect(res.success).toBe(false);
      expect(res.error).toContain('terminal state');
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
