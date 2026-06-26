import { vi, describe, it, expect, beforeEach } from 'vitest';
import { submitBookingAction } from '@/app/actions/booking';

// Mock mocks
const mockSingle = vi.fn();
const mockInsertSelectSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'route_prices') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingle
            })
          })
        })
      };
    }
    if (table === 'bookings') {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsertSelectSingle
          })
        })
      };
    }
    return {};
  })
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

vi.mock('@/lib/mail/smtp', () => ({
  sendBookingConfirmationEmail: vi.fn().mockResolvedValue(true),
}));

describe('submitBookingAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validUuid1 = '550e8400-e29b-41d4-a716-446655440000';
  const validUuid2 = '550e8400-e29b-41d4-a716-446655440001';
  const mockBookingReference = '770e8400-e29b-41d4-a716-446655440000';

  const validPayload = {
    pickupLocationId: validUuid1,
    destinationLocationId: validUuid2,
    date: '2026-06-27',
    time: '15:30',
    price: 75.00,
    customerName: 'Alice Smith',
    customerEmail: 'alice@example.com',
    customerPhone: '+15551234567',
    flightNumber: 'AA123',
    notes: 'No notes'
  };

  it('should return validation errors if Zod schema validation fails', async () => {
    const invalidPayload = {
      ...validPayload,
      customerEmail: 'not-an-email',
      customerPhone: '123'
    };

    const res = await submitBookingAction(invalidPayload);
    expect(res.success).toBe(false);
    expect(res.validationErrors).toBeDefined();
    expect(res.validationErrors?.customerEmail).toBeDefined();
    expect(res.validationErrors?.customerPhone).toBeDefined();
  });

  it('should return error if route price lookup fails or price does not exist', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'No price found for this route.' }
    });

    const res = await submitBookingAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toContain('No price defined');
  });

  it('should return error if price submitted does not match the pricing matrix in DB', async () => {
    mockSingle.mockResolvedValue({
      data: { price: 99.00 }, // different price in DB
      error: null
    });

    const res = await submitBookingAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Price verification failed');
  });

  it('should save booking, send SMTP email, and return bookingReference on success', async () => {
    // Mock price matrix query
    mockSingle.mockResolvedValue({
      data: { price: 75.00 },
      error: null
    });

    // Mock insert query
    mockInsertSelectSingle.mockResolvedValue({
      data: { booking_reference: mockBookingReference },
      error: null
    });

    const res = await submitBookingAction(validPayload);
    expect(res.success).toBe(true);
    if (res.success && res.data) {
      expect(res.data.bookingReference).toBe(mockBookingReference);
    }
  });

  it('should return error if database insert fails', async () => {
    mockSingle.mockResolvedValue({
      data: { price: 75.00 },
      error: null
    });

    mockInsertSelectSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database insert failed' }
    });

    const res = await submitBookingAction(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toBe('Database insert failed');
  });
});
