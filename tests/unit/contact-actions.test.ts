/**
 * T005 / T010 / T014 / T019 — Contact Server Action Unit Tests
 *
 * Covers submitContactForm (US1), fetchInquiriesAction (US2),
 * updateInquiryStatusAction (US3), and getUnreadInquiriesCount (US4).
 * Uses Vitest mocks to avoid real DB calls.
 *
 * Spec: specs/010-contact-inquiries/contracts/server-actions.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────
// Module mocks
// ─────────────────────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { submitContactForm } from '@/app/actions/contact';
import {
  fetchInquiriesAction,
  updateInquiryStatusAction,
  getUnreadInquiriesCount,
} from '@/app/admin/inquiries/actions';

// ─────────────────────────────────────────────────────────────
// Chainable Supabase mock
// ─────────────────────────────────────────────────────────────

const ADMIN_USER = { id: 'admin-1', email: 'admin@airport.test' };
const VALID_UUID = '00000000-0000-0000-0000-000000000001';

interface MockClientConfig {
  user?: { id: string; email: string } | null;
  authError?: unknown;
  /** Result returned by .single() terminators (insert / update / status lookup). */
  singleResult?: { data: unknown; error: unknown };
  /** Result returned by .maybeSingle() terminators. */
  maybeSingleResult?: { data: unknown; error: unknown };
  /** Result returned when the chain itself is awaited (count / range queries). */
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
    insert: track('insert'),
    update: track('update'),
    order: track('order'),
    range: track('range'),
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
});

const validContactPayload = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Custom route inquiry',
  message: 'I would like to request pricing for a custom route.',
};

// ─────────────────────────────────────────────────────────────
// US1 — submitContactForm
// ─────────────────────────────────────────────────────────────

describe('submitContactForm — public contact submission (US1)', () => {
  it('persists a valid inquiry and returns success', async () => {
    const { calls } = mockSupabase({
      singleResult: { data: { id: VALID_UUID }, error: null },
    });

    const result = await submitContactForm(validContactPayload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ success: true });
    }
    // Must insert into the dedicated table with the initial 'Unread' status.
    expect(calls.insert).toBeDefined();
    const insertArgs = calls.insert[0] as unknown[];
    expect(insertArgs[0]).toMatchObject({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Custom route inquiry',
      status: 'Unread',
    });
  });

  it('returns validation errors when required fields are missing', async () => {
    const result = await submitContactForm({
      name: '',
      email: 'bad',
      subject: '',
      message: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors).toBeDefined();
    }
  });

  it('returns a failure response when the database insert fails', async () => {
    mockSupabase({
      singleResult: { data: null, error: { message: 'insert failed' } },
    });

    const result = await submitContactForm(validContactPayload);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// US2 — fetchInquiriesAction
// ─────────────────────────────────────────────────────────────

describe('fetchInquiriesAction — paginated inquiries list (US2)', () => {
  it('returns inquiries + total count for an authenticated admin', async () => {
    const { calls } = mockSupabase({
      awaitResult: {
        data: [{ id: VALID_UUID, name: 'A', status: 'Unread' }],
        error: null,
        count: 1,
      },
    });

    const result = await fetchInquiriesAction({ page: 1, limit: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.inquiries).toHaveLength(1);
      expect(result.data.totalCount).toBe(1);
    }
    // Must order newest-first and request exact counting.
    expect(calls.order).toContainEqual(['created_at', { ascending: false }]);
    const selectArgs = calls.select[0] as unknown[];
    expect(selectArgs[1]).toMatchObject({ count: 'exact' });
  });

  it('applies server-side pagination via range()', async () => {
    const { calls } = mockSupabase({
      awaitResult: { data: [], error: null, count: 25 },
    });

    await fetchInquiriesAction({ page: 2, limit: 10 });

    // Page 2, limit 10 → range(10, 19)
    expect(calls.range).toContainEqual([10, 19]);
  });

  it('returns an unauthorized error when no admin session exists', async () => {
    mockSupabase({ user: null });

    const result = await fetchInquiriesAction({ page: 1, limit: 10 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Unauthorized');
    }
  });

  it('returns a failure response when the database throws an error', async () => {
    mockSupabase({
      awaitResult: { data: null, error: { message: 'connection lost' }, count: null },
    });

    const result = await fetchInquiriesAction({ page: 1, limit: 10 });

    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// US3 — updateInquiryStatusAction
// ─────────────────────────────────────────────────────────────

describe('updateInquiryStatusAction — status update (US3)', () => {
  it('updates the status and returns the updated inquiry', async () => {
    const { calls } = mockSupabase({
      singleResult: {
        data: { id: VALID_UUID, name: 'A', status: 'Read' },
        error: null,
      },
    });

    const result = await updateInquiryStatusAction({
      inquiryId: VALID_UUID,
      status: 'Read',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('Read');
    }
    expect(calls.update).toContainEqual([{ status: 'Read' }]);
    expect(calls.eq).toContainEqual(['id', VALID_UUID]);
  });

  it('rejects an invalid status value', async () => {
    // The action authorizes before validating, so provide an admin session.
    mockSupabase();

    const result = await updateInquiryStatusAction({
      inquiryId: VALID_UUID,
      status: 'Archived',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.validationErrors).toBeDefined();
    }
  });

  it('returns "Inquiry not found" when no row matches', async () => {
    mockSupabase({
      singleResult: { data: null, error: { code: 'PGRST116', message: 'rows' } },
    });

    const result = await updateInquiryStatusAction({
      inquiryId: VALID_UUID,
      status: 'Read',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('not found');
    }
  });

  it('returns an unauthorized error when no admin session exists', async () => {
    mockSupabase({ user: null });

    const result = await updateInquiryStatusAction({
      inquiryId: VALID_UUID,
      status: 'Read',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Unauthorized');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// US4 — getUnreadInquiriesCount
// ─────────────────────────────────────────────────────────────

describe('getUnreadInquiriesCount — unread badge count (US4)', () => {
  it('returns the count of unread inquiries for an authenticated admin', async () => {
    const { calls } = mockSupabase({
      awaitResult: { data: null, error: null, count: 3 },
    });

    const result = await getUnreadInquiriesCount();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(3);
    }
    // Must filter by the 'Unread' status.
    expect(calls.eq).toContainEqual(['status', 'Unread']);
  });

  it('uses a head-only count query (select with count: exact, head: true)', async () => {
    const { calls } = mockSupabase({
      awaitResult: { data: null, error: null, count: 0 },
    });

    await getUnreadInquiriesCount();

    const selectArgs = calls.select[0] as unknown[];
    expect(selectArgs[1]).toMatchObject({ count: 'exact', head: true });
  });

  it('returns count 0 when there are no unread inquiries', async () => {
    mockSupabase({ awaitResult: { data: null, error: null, count: 0 } });

    const result = await getUnreadInquiriesCount();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(0);
    }
  });

  it('returns an unauthorized error when no admin session exists', async () => {
    mockSupabase({ user: null });

    const result = await getUnreadInquiriesCount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Unauthorized');
    }
  });

  it('returns a failure response when the database throws an error', async () => {
    mockSupabase({
      awaitResult: { data: null, error: { message: 'connection lost' }, count: null },
    });

    const result = await getUnreadInquiriesCount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed');
    }
  });
});
