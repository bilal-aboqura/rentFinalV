/**
 * T009 [US2] — Unit tests for submitBookingAction server action
 *
 * Tests: schema validation, price tampering prevention, and error handling.
 * Uses Vitest mocks to avoid real DB/SMTP calls.
 *
 * Spec: specs/006-booking-wizard-step2/contracts/submit-booking.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitBookingSchema } from '@/lib/validation/booking';

// ─────────────────────────────────────────────────────────────
// Module mocks for submitBookingAction & getPendingBookingsCount
// (Spec 008 — Feature F-08)
// ─────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/mail/smtp', () => ({
  sendBookingConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendAdminNotificationEmail: vi.fn().mockResolvedValue(null),
}));

import { createClient } from '@/lib/supabase/server';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/mail/smtp';
import { submitBookingAction } from '@/app/actions/booking';
import { getPendingBookingsCount } from '@/app/admin/bookings/actions';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const PICKUP_ID  = '00000000-0000-0000-0000-000000000001';
const DEST_ID    = '00000000-0000-0000-0000-000000000002';

const validPayload = {
  pickupLocationId: PICKUP_ID,
  destinationLocationId: DEST_ID,
  date: '2030-12-31',
  time: '14:00',
  price: 75,
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '+15551234567',
};

// ─────────────────────────────────────────────────────────────
// Chainable Supabase mock (Spec 008 — covers submitBookingAction
// and getPendingBookingsCount query shapes)
// ─────────────────────────────────────────────────────────────

const ADMIN_USER = { id: 'admin-1', email: 'admin@airport.test' };

interface MockClientConfig {
  user?: { id: string; email: string } | null;
  authError?: unknown;
  maybeSingleResult?: { data: unknown; error: unknown };
  singleResult?: { data: unknown; error: unknown };
  /** Result returned when the chain itself is awaited (e.g. head-only count query). */
  awaitResult?: { data: unknown; error: unknown; count: number | null };
}

function buildMockClient(config: MockClientConfig = {}) {
  const calls: Record<string, unknown[]> = {};
  const track = (key: string) => (...args: unknown[]) => {
    (calls[key] ??= []).push(args);
    return chain;
  };

  // The chain is also thenable so `await builder.eq(...)` resolves to awaitResult.
  const chain = {
    select: track('select'),
    eq: track('eq'),
    neq: track('neq'),
    in: track('in'),
    insert: track('insert'),
    update: track('update'),
    order: track('order'),
    maybeSingle: () => config.maybeSingleResult ?? { data: null, error: null },
    single: () => config.singleResult ?? { data: null, error: null },
    then: (resolve: (v: unknown) => void) =>
      resolve(config.awaitResult ?? { data: null, error: null, count: null }),
  };

  const user = config.user === undefined ? ADMIN_USER : config.user;
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: config.authError ?? null }),
    },
    from: vi.fn(() => chain),
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
  vi.mocked(sendBookingConfirmationEmail).mockClear();
  vi.mocked(sendAdminNotificationEmail).mockClear();
});

// ─────────────────────────────────────────────────────────────
// Schema Validation (no DB required)
// ─────────────────────────────────────────────────────────────

describe('submitBookingAction — Schema Parsing (US2)', () => {
  it('SubmitBookingSchema accepts a valid full payload', () => {
    const result = SubmitBookingSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('SubmitBookingSchema rejects when customerPhone is invalid E.164', () => {
    const result = SubmitBookingSchema.safeParse({
      ...validPayload,
      customerPhone: 'not-a-phone',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('customerPhone'));
      expect(issue).toBeDefined();
    }
  });

  it('SubmitBookingSchema rejects when price is negative', () => {
    const result = SubmitBookingSchema.safeParse({ ...validPayload, price: -5 });
    expect(result.success).toBe(false);
  });

  it('SubmitBookingSchema rejects when pickup === destination', () => {
    const result = SubmitBookingSchema.safeParse({
      ...validPayload,
      destinationLocationId: PICKUP_ID,
    });
    expect(result.success).toBe(false);
  });

  it('SubmitBookingSchema rejects when customerEmail is malformed', () => {
    const result = SubmitBookingSchema.safeParse({ ...validPayload, customerEmail: 'bad-email' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Price Verification Logic (unit-level)
// ─────────────────────────────────────────────────────────────

describe('Price Verification Logic (US2)', () => {
  it('detects price tampering when submitted price differs by more than 0.01', () => {
    const dbPrice = 75.00;
    const submittedPrice = 1.00; // tampering attempt

    const isTampered = Math.abs(dbPrice - submittedPrice) > 0.01;
    expect(isTampered).toBe(true);
  });

  it('accepts matching prices within 0.01 tolerance', () => {
    const dbPrice = 75.00;
    const submittedPrice = 75.005; // floating point edge case

    const isTampered = Math.abs(dbPrice - submittedPrice) > 0.01;
    expect(isTampered).toBe(false);
  });

  it('accepts exact price match', () => {
    const dbPrice = 75.00;
    const submittedPrice = 75.00;

    const isTampered = Math.abs(dbPrice - submittedPrice) > 0.01;
    expect(isTampered).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Spec 008 / US1 — submitBookingAction admin email trigger (T003)
// ─────────────────────────────────────────────────────────────

describe('submitBookingAction — admin notification email trigger (US1)', () => {
  it('dispatches a sendAdminNotificationEmail call after a successful booking insert', async () => {
    process.env.ADMIN_EMAIL = 'admin@airporttransfers.com';
    mockSupabase({
      maybeSingleResult: { data: { price: 75 }, error: null },
      awaitResult: {
        data: [
          { id: PICKUP_ID, name: 'JFK Airport' },
          { id: DEST_ID, name: 'Grand Hotel' },
        ],
        error: null,
      },
      singleResult: { data: { booking_reference: 'ref-abc-123' }, error: null },
    });

    const result = await submitBookingAction(validPayload);

    expect(result.success).toBe(true);
    expect(sendAdminNotificationEmail).toHaveBeenCalledTimes(1);
    expect(sendAdminNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: 'ref-abc-123',
        pickupName: 'JFK Airport',
        destinationName: 'Grand Hotel',
        date: '2030-12-31',
        time: '14:00',
        customerName: 'Jane Doe',
        adminEmail: 'admin@airporttransfers.com',
      })
    );
  });

  it('also dispatches the passenger confirmation email', async () => {
    process.env.ADMIN_EMAIL = 'admin@airporttransfers.com';
    mockSupabase({
      maybeSingleResult: { data: { price: 75 }, error: null },
      awaitResult: { data: [{ id: PICKUP_ID, name: 'A' }, { id: DEST_ID, name: 'B' }], error: null },
      singleResult: { data: { booking_reference: 'ref-xyz' }, error: null },
    });

    await submitBookingAction(validPayload);

    expect(sendBookingConfirmationEmail).toHaveBeenCalledTimes(1);
  });

  it('does NOT send the admin email when the booking insert fails', async () => {
    process.env.ADMIN_EMAIL = 'admin@airporttransfers.com';
    mockSupabase({
      maybeSingleResult: { data: { price: 75 }, error: null },
      awaitResult: { data: [], error: null },
      singleResult: { data: null, error: { message: 'insert failed' } },
    });

    const result = await submitBookingAction(validPayload);

    expect(result.success).toBe(false);
    expect(sendAdminNotificationEmail).not.toHaveBeenCalled();
  });

  it('does NOT send the admin email when price verification fails', async () => {
    process.env.ADMIN_EMAIL = 'admin@airporttransfers.com';
    mockSupabase({
      maybeSingleResult: { data: { price: 999 }, error: null }, // DB price mismatch
      awaitResult: { data: [], error: null },
      singleResult: { data: null, error: null },
    });

    const result = await submitBookingAction({ ...validPayload, price: 1 });

    expect(result.success).toBe(false);
    expect(sendAdminNotificationEmail).not.toHaveBeenCalled();
  });

  it('still succeeds when ADMIN_EMAIL is not configured (skips admin email)', async () => {
    delete process.env.ADMIN_EMAIL;
    mockSupabase({
      maybeSingleResult: { data: { price: 75 }, error: null },
      awaitResult: { data: [{ id: PICKUP_ID, name: 'A' }, { id: DEST_ID, name: 'B' }], error: null },
      singleResult: { data: { booking_reference: 'ref-skip' }, error: null },
    });

    const result = await submitBookingAction(validPayload);

    expect(result.success).toBe(true);
    expect(sendAdminNotificationEmail).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// Spec 008 / US2 — getPendingBookingsCount (T006)
// ─────────────────────────────────────────────────────────────

describe('getPendingBookingsCount — pending count query (US2)', () => {
  it('returns the count of pending bookings for an authenticated admin', async () => {
    const { calls } = mockSupabase({
      awaitResult: { data: null, error: null, count: 7 },
    });

    const result = await getPendingBookingsCount();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(7);
    }
    // Must filter by the 'Pending' status.
    expect(calls.eq).toContainEqual(['status', 'Pending']);
  });

  it('uses a head-only count query (select with count: exact)', async () => {
    const { calls } = mockSupabase({
      awaitResult: { data: null, error: null, count: 0 },
    });

    await getPendingBookingsCount();

    expect(calls.select).toBeDefined();
    expect(calls.select.length).toBeGreaterThan(0);
    // The select call should request exact counting.
    const selectArgs = calls.select[0];
    expect(selectArgs[1]).toMatchObject({ count: 'exact', head: true });
  });

  it('returns count 0 when there are no pending bookings', async () => {
    mockSupabase({ awaitResult: { data: null, error: null, count: 0 } });

    const result = await getPendingBookingsCount();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(0);
    }
  });

  it('returns an unauthorized error when no admin session exists', async () => {
    mockSupabase({ user: null });

    const result = await getPendingBookingsCount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized. Administrator access required.');
    }
  });

  it('returns a failure response when the database throws an error', async () => {
    mockSupabase({ awaitResult: { data: null, error: { message: 'connection lost' }, count: null } });

    const result = await getPendingBookingsCount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed to retrieve pending booking count');
    }
  });
});
