/**
 * Spec 007: Bookings Management Dashboard
 * Unit tests for the admin booking server actions.
 *
 * Covers (TDD — tests written to drive implementation):
 * - T004 / US1: fetchBookingsAction — pagination ranges & status filter queries
 * - T008 / US2: updateBookingStatusAction — input schemas & terminal status locks
 * - T012 / US3: assignDriverAction — driver assignment & terminal status locks
 *
 * The Supabase client and next/cache are mocked so no real DB / Next runtime is required.
 *
 * Spec: specs/007-bookings-dashboard/contracts/booking-actions.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UpdateBookingStatusSchema,
  AssignDriverSchema,
} from '@/lib/validation/booking';

// ─────────────────────────────────────────────────────────────
// Module mocks (hoisted by Vitest)
// ─────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/mail/smtp', () => ({
  sendBookingConfirmedEmail: vi.fn().mockResolvedValue(null),
  sendBookingCancelledEmail: vi.fn().mockResolvedValue(null),
}));

import { createClient } from '@/lib/supabase/server';
import { sendBookingConfirmedEmail, sendBookingCancelledEmail } from '@/lib/mail/smtp';
import {
  fetchBookingsAction,
  updateBookingStatusAction,
  assignDriverAction,
} from '@/app/admin/bookings/actions';

// ─────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────

const ADMIN_USER = { id: 'admin-1', email: 'admin@airport.test' };

const BOOKING_ID = '11111111-1111-1111-1111-111111111111';
const DRIVER_ID = '22222222-2222-2222-2222-222222222222';

const sampleBooking = {
  id: BOOKING_ID,
  booking_reference: '203a95aa-208b-4946-b605-e408bf4a511c',
  pickup_location_id: '00000000-0000-0000-0000-000000000001',
  destination_location_id: '00000000-0000-0000-0000-000000000002',
  booking_date: '2026-07-01',
  booking_time: '14:30:00',
  price: 45,
  customer_name: 'Alice Johnson',
  customer_email: 'alice@example.com',
  customer_phone: '+15551234567',
  flight_number: 'UA123',
  notes: 'Need booster seat',
  status: 'Pending',
  driver_id: null,
  created_at: '2026-06-26T03:00:00Z',
  pickup: { name: 'Airport Terminal 1' },
  destination: { name: 'Downtown Hotel' },
  driver: null,
};

// ─────────────────────────────────────────────────────────────
// Chainable Supabase mock
// ─────────────────────────────────────────────────────────────

interface MockClientConfig {
  user?: { id: string; email: string } | null;
  authError?: unknown;
  rangeResult?: { data: unknown[] | null; error: unknown; count: number | null };
  singleQueue?: Array<{ data: unknown; error: unknown }>;
}

function buildMockClient(config: MockClientConfig = {}) {
  const calls: Record<string, unknown[]> = {};
  const track = (key: string) => (...args: unknown[]) => {
    (calls[key] ??= []).push(args);
    return chain;
  };

  let singleIndex = 0;
  const chain = {
    select: track('select'),
    eq: track('eq'),
    neq: track('neq'),
    order: track('order'),
    update: track('update'),
    insert: track('insert'),
    range: (...args: unknown[]) => {
      (calls.range ??= []).push(args);
      return config.rangeResult ?? { data: [], error: null, count: 0 };
    },
    single: () => {
      (calls.single ??= []).push([]);
      const queue = config.singleQueue ?? [];
      const idx = Math.min(singleIndex++, Math.max(queue.length - 1, 0));
      return queue[idx] ?? { data: null, error: null };
    },
  };

  const user = config.user === undefined ? ADMIN_USER : config.user;

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: config.authError ?? null }),
    },
    from: vi.fn().mockReturnValue(chain),
  };

  return { client, calls };
}

/** Configure the mocked createClient to resolve with a fresh client. */
function mockSupabase(config: MockClientConfig = {}) {
  const built = buildMockClient(config);
  vi.mocked(createClient).mockResolvedValue(built.client as never);
  return built;
}

beforeEach(() => {
  vi.mocked(createClient).mockReset();
  vi.mocked(sendBookingConfirmedEmail).mockClear();
  vi.mocked(sendBookingCancelledEmail).mockClear();
});

// ─────────────────────────────────────────────────────────────
// Schema validation (pure, no DB)
// ─────────────────────────────────────────────────────────────

describe('UpdateBookingStatusSchema (Spec 007)', () => {
  it('accepts a valid bookingId and status', () => {
    const result = UpdateBookingStatusSchema.safeParse({
      bookingId: BOOKING_ID,
      status: 'Confirmed',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid booking UUID', () => {
    const result = UpdateBookingStatusSchema.safeParse({
      bookingId: 'not-a-uuid',
      status: 'Confirmed',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status selection', () => {
    const result = UpdateBookingStatusSchema.safeParse({
      bookingId: BOOKING_ID,
      status: 'Archived',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all four lifecycle statuses', () => {
    for (const status of ['Pending', 'Confirmed', 'Completed', 'Cancelled'] as const) {
      expect(
        UpdateBookingStatusSchema.safeParse({ bookingId: BOOKING_ID, status }).success
      ).toBe(true);
    }
  });
});

describe('AssignDriverSchema (Spec 007)', () => {
  it('accepts a valid bookingId and driverId', () => {
    const result = AssignDriverSchema.safeParse({
      bookingId: BOOKING_ID,
      driverId: DRIVER_ID,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a null driverId (un-assignment)', () => {
    const result = AssignDriverSchema.safeParse({ bookingId: BOOKING_ID, driverId: null });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid booking UUID', () => {
    const result = AssignDriverSchema.safeParse({ bookingId: 'bad', driverId: DRIVER_ID });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid driver UUID', () => {
    const result = AssignDriverSchema.safeParse({ bookingId: BOOKING_ID, driverId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// US1 — fetchBookingsAction: pagination & status filtering
// ─────────────────────────────────────────────────────────────

describe('fetchBookingsAction — pagination & filtering (US1)', () => {
  it('computes the correct range for page 1 / limit 10', async () => {
    const { calls } = mockSupabase({
      rangeResult: { data: [sampleBooking], error: null, count: 1 },
    });

    const result = await fetchBookingsAction({ page: 1, limit: 10 });

    expect(result.success).toBe(true);
    expect(calls.range[0]).toEqual([0, 9]);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.bookings).toHaveLength(1);
    }
  });

  it('computes the correct range for page 3 / limit 10', async () => {
    const { calls } = mockSupabase({
      rangeResult: { data: [], error: null, count: 25 },
    });

    const result = await fetchBookingsAction({ page: 3, limit: 10 });

    expect(result.success).toBe(true);
    // page 3 → start = 20, end = 29
    expect(calls.range[0]).toEqual([20, 29]);
  });

  it('computes the correct range for a custom limit of 5', async () => {
    const { calls } = mockSupabase({ rangeResult: { data: [], error: null, count: 0 } });

    await fetchBookingsAction({ page: 2, limit: 5 });

    // page 2, limit 5 → start = 5, end = 9
    expect(calls.range[0]).toEqual([5, 9]);
  });

  it('clamps a non-positive page to 1', async () => {
    const { calls } = mockSupabase({ rangeResult: { data: [], error: null, count: 0 } });

    await fetchBookingsAction({ page: 0, limit: 10 });

    expect(calls.range[0]).toEqual([0, 9]);
  });

  it('applies an eq("status", filter) query when a status filter is selected', async () => {
    const { calls } = mockSupabase({ rangeResult: { data: [], error: null, count: 0 } });

    await fetchBookingsAction({ page: 1, limit: 10, statusFilter: 'Pending' });

    expect(calls.eq).toContainEqual(['status', 'Pending']);
  });

  it('does NOT apply a status eq query when statusFilter is "All"', async () => {
    const { calls } = mockSupabase({ rangeResult: { data: [], error: null, count: 0 } });

    await fetchBookingsAction({ page: 1, limit: 10, statusFilter: 'All' });

    expect(calls.eq).toBeUndefined();
  });

  it('defaults statusFilter to "All" when omitted (no eq query)', async () => {
    const { calls } = mockSupabase({ rangeResult: { data: [], error: null, count: 0 } });

    await fetchBookingsAction({ page: 1, limit: 10 });

    expect(calls.eq).toBeUndefined();
  });

  it('returns the unauthorized error when no admin session exists', async () => {
    mockSupabase({ user: null });

    const result = await fetchBookingsAction({ page: 1, limit: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized. Administrator access required.');
    }
  });

  it('propagates a database error', async () => {
    mockSupabase({
      rangeResult: { data: null, error: { message: 'boom' }, count: null },
    });

    const result = await fetchBookingsAction({ page: 1, limit: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('boom');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// US2 — updateBookingStatusAction: schemas & terminal locks
// ─────────────────────────────────────────────────────────────

describe('updateBookingStatusAction — terminal status locks (US2)', () => {
  it('rejects an invalid bookingId via schema validation', async () => {
    mockSupabase();

    const result = await updateBookingStatusAction({
      bookingId: 'not-a-uuid',
      status: 'Confirmed',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid/i);
    }
  });

  it('returns the unauthorized error when no admin session exists', async () => {
    mockSupabase({ user: null });

    const result = await updateBookingStatusAction({
      bookingId: BOOKING_ID,
      status: 'Confirmed',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized. Administrator access required.');
    }
  });

  it('returns "Booking not found." when the booking does not exist', async () => {
    mockSupabase({
      singleQueue: [{ data: null, error: { message: 'PGRST116' } }],
    });

    const result = await updateBookingStatusAction({
      bookingId: BOOKING_ID,
      status: 'Confirmed',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Booking not found.');
    }
  });

  it('locks a Completed booking from status changes', async () => {
    const { calls } = mockSupabase({
      singleQueue: [{ data: { status: 'Completed' }, error: null }],
    });

    const result = await updateBookingStatusAction({
      bookingId: BOOKING_ID,
      status: 'Pending',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        'Cannot modify a booking that is in a terminal state (Completed or Cancelled).'
      );
    }
    // No update should be attempted on a terminal booking.
    expect(calls.update).toBeUndefined();
  });

  it('locks a Cancelled booking from status changes', async () => {
    const { calls } = mockSupabase({
      singleQueue: [{ data: { status: 'Cancelled' }, error: null }],
    });

    const result = await updateBookingStatusAction({
      bookingId: BOOKING_ID,
      status: 'Confirmed',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('terminal state');
    }
    expect(calls.update).toBeUndefined();
  });

  it('updates a Pending booking and returns the updated record', async () => {
    const { calls } = mockSupabase({
      singleQueue: [
        { data: { status: 'Pending' }, error: null },
        { data: { ...sampleBooking, status: 'Confirmed' }, error: null },
      ],
    });

    const result = await updateBookingStatusAction({
      bookingId: BOOKING_ID,
      status: 'Confirmed',
    });

    expect(result.success).toBe(true);
    expect(calls.update).toContainEqual([{ status: 'Confirmed' }]);
    if (result.success) {
      expect(result.data.status).toBe('Confirmed');
    }
  });

  it('allows transitioning a Confirmed booking to Completed', async () => {
    const { calls } = mockSupabase({
      singleQueue: [
        { data: { status: 'Confirmed' }, error: null },
        { data: { ...sampleBooking, status: 'Completed' }, error: null },
      ],
    });

    const result = await updateBookingStatusAction({
      bookingId: BOOKING_ID,
      status: 'Completed',
    });

    expect(result.success).toBe(true);
    expect(calls.update).toContainEqual([{ status: 'Completed' }]);
  });
});

// ─────────────────────────────────────────────────────────────
// US3 — assignDriverAction: driver assignment & terminal locks
// ─────────────────────────────────────────────────────────────

describe('assignDriverAction — driver assignment & terminal locks (US3)', () => {
  it('rejects an invalid driverId via schema validation', async () => {
    mockSupabase();

    const result = await assignDriverAction({
      bookingId: BOOKING_ID,
      driverId: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid/i);
    }
  });

  it('returns the unauthorized error when no admin session exists', async () => {
    mockSupabase({ user: null });

    const result = await assignDriverAction({
      bookingId: BOOKING_ID,
      driverId: DRIVER_ID,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized. Administrator access required.');
    }
  });

  it('locks a Cancelled booking from driver assignment', async () => {
    const { calls } = mockSupabase({
      singleQueue: [{ data: { status: 'Cancelled' }, error: null }],
    });

    const result = await assignDriverAction({
      bookingId: BOOKING_ID,
      driverId: DRIVER_ID,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('terminal state');
    }
    expect(calls.update).toBeUndefined();
  });

  it('locks a Completed booking from driver assignment', async () => {
    mockSupabase({ singleQueue: [{ data: { status: 'Completed' }, error: null }] });

    const result = await assignDriverAction({
      bookingId: BOOKING_ID,
      driverId: DRIVER_ID,
    });

    expect(result.success).toBe(false);
  });

  it('assigns a driver to a Pending booking and returns the updated record', async () => {
    const { calls } = mockSupabase({
      singleQueue: [
        { data: { status: 'Pending' }, error: null },
        { data: { ...sampleBooking, driver_id: DRIVER_ID, driver: { name: 'Sam' } }, error: null },
      ],
    });

    const result = await assignDriverAction({
      bookingId: BOOKING_ID,
      driverId: DRIVER_ID,
    });

    expect(result.success).toBe(true);
    expect(calls.update).toContainEqual([{ driver_id: DRIVER_ID }]);
    if (result.success) {
      expect(result.data.driver_id).toBe(DRIVER_ID);
    }
  });

  it('allows un-assigning a driver (null driverId) on a non-terminal booking', async () => {
    const { calls } = mockSupabase({
      singleQueue: [
        { data: { status: 'Confirmed' }, error: null },
        { data: { ...sampleBooking, driver_id: null }, error: null },
      ],
    });

    const result = await assignDriverAction({
      bookingId: BOOKING_ID,
      driverId: null,
    });

    expect(result.success).toBe(true);
    expect(calls.update).toContainEqual([{ driver_id: null }]);
  });
});

// ─────────────────────────────────────────────────────────────
// Spec 009 — Status Change Alert: email trigger wiring
// - T005 [US1]: sendBookingConfirmedEmail on Confirmed transition
// - T011 [US2]: sendBookingCancelledEmail on Cancelled transition
// - FR-006:     no email on Completed/Pending transitions
// - T006 [US1]: sendBookingConfirmedEmail on driver assign to Confirmed booking
// ─────────────────────────────────────────────────────────────

describe('Spec 009 — status change email triggers', () => {
  it('dispatches sendBookingConfirmedEmail when status transitions to Confirmed (T005)', async () => {
    mockSupabase({
      singleQueue: [
        { data: { status: 'Pending' }, error: null },
        { data: { ...sampleBooking, status: 'Confirmed' }, error: null },
      ],
    });

    const result = await updateBookingStatusAction({ bookingId: BOOKING_ID, status: 'Confirmed' });

    expect(result.success).toBe(true);
    expect(sendBookingConfirmedEmail).toHaveBeenCalledTimes(1);
    expect(sendBookingConfirmedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        customerName: 'Alice Johnson',
        reference: sampleBooking.booking_reference,
        pickupName: 'Airport Terminal 1',
        destinationName: 'Downtown Hotel',
        date: '2026-07-01',
        time: '14:30:00',
      })
    );
  });

  it('includes driver name/phone in the confirmed email when a driver is assigned (T005)', async () => {
    mockSupabase({
      singleQueue: [
        { data: { status: 'Pending' }, error: null },
        {
          data: {
            ...sampleBooking,
            status: 'Confirmed',
            driver: { name: 'Sam Driver', phone: '+15559990000' },
          },
          error: null,
        },
      ],
    });

    await updateBookingStatusAction({ bookingId: BOOKING_ID, status: 'Confirmed' });

    expect(sendBookingConfirmedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        driverName: 'Sam Driver',
        driverPhone: '+15559990000',
      })
    );
  });

  it('dispatches sendBookingCancelledEmail when status transitions to Cancelled (T011)', async () => {
    mockSupabase({
      singleQueue: [
        { data: { status: 'Pending' }, error: null },
        { data: { ...sampleBooking, status: 'Cancelled' }, error: null },
      ],
    });

    const result = await updateBookingStatusAction({ bookingId: BOOKING_ID, status: 'Cancelled' });

    expect(result.success).toBe(true);
    expect(sendBookingCancelledEmail).toHaveBeenCalledTimes(1);
    expect(sendBookingCancelledEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        customerName: 'Alice Johnson',
        reference: sampleBooking.booking_reference,
      })
    );
  });

  it('does NOT dispatch any email when status transitions to Completed or Pending (FR-006)', async () => {
    mockSupabase({
      singleQueue: [
        { data: { status: 'Confirmed' }, error: null },
        { data: { ...sampleBooking, status: 'Completed' }, error: null },
      ],
    });

    await updateBookingStatusAction({ bookingId: BOOKING_ID, status: 'Completed' });

    expect(sendBookingConfirmedEmail).not.toHaveBeenCalled();
    expect(sendBookingCancelledEmail).not.toHaveBeenCalled();
  });

  it('dispatches sendBookingConfirmedEmail when a driver is assigned to an already-Confirmed booking (T006)', async () => {
    mockSupabase({
      singleQueue: [
        { data: { status: 'Confirmed' }, error: null },
        {
          data: {
            ...sampleBooking,
            status: 'Confirmed',
            driver: { name: 'Sam Driver', phone: '+15559990000' },
          },
          error: null,
        },
      ],
    });

    const result = await assignDriverAction({ bookingId: BOOKING_ID, driverId: DRIVER_ID });

    expect(result.success).toBe(true);
    expect(sendBookingConfirmedEmail).toHaveBeenCalledTimes(1);
    expect(sendBookingConfirmedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        reference: sampleBooking.booking_reference,
        driverName: 'Sam Driver',
        driverPhone: '+15559990000',
      })
    );
  });

  it('does NOT dispatch a confirmation email when a driver is assigned to a non-Confirmed booking (T006)', async () => {
    mockSupabase({
      singleQueue: [
        { data: { status: 'Pending' }, error: null },
        { data: { ...sampleBooking, status: 'Pending', driver: { name: 'Sam Driver', phone: '+15559990000' } }, error: null },
      ],
    });

    await assignDriverAction({ bookingId: BOOKING_ID, driverId: DRIVER_ID });

    expect(sendBookingConfirmedEmail).not.toHaveBeenCalled();
    expect(sendBookingCancelledEmail).not.toHaveBeenCalled();
  });

  it('does NOT dispatch any email when the status update fails (FR-007)', async () => {
    mockSupabase({
      singleQueue: [
        { data: { status: 'Pending' }, error: null },
        { data: null, error: { message: 'update failed' } },
      ],
    });

    const result = await updateBookingStatusAction({ bookingId: BOOKING_ID, status: 'Confirmed' });

    expect(result.success).toBe(false);
    expect(sendBookingConfirmedEmail).not.toHaveBeenCalled();
  });
});
