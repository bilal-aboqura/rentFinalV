/**
 * T030 [US4] - Vitest integration tests for deleteLocationAction.
 * Written FIRST following TDD.
 * Verifies referential integrity blocks for bookings and pricing rules.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ----------------------------------------------------------------
// Supabase mock - using factory functions for proper chaining
// ----------------------------------------------------------------
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// Helper to create a properly chained mock for .select().eq().maybeSingle()
function makeMaybySingleChain(result: { data: unknown; error: unknown }) {
  const maybySingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle: maybySingle });
  const select = vi.fn().mockReturnValue({ eq });
  return { select };
}

// Helper to create a properly chained mock for .delete().eq().select().single()
function makeDeleteChain(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const del = vi.fn().mockReturnValue({ eq });
  return { delete: del };
}

describe('[US4] deleteLocationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('successfully deletes an unused location', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const fromMock = vi.fn();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: fromMock,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null }),
      },
    });

    // Call 1: bookings check
    fromMock.mockReturnValueOnce(makeMaybySingleChain({ data: null, error: null }));
    // Call 2: pricing_rules check
    fromMock.mockReturnValueOnce(makeMaybySingleChain({ data: null, error: null }));
    // Call 3: delete
    fromMock.mockReturnValueOnce(makeDeleteChain({ data: { id: VALID_UUID }, error: null }));

    const { deleteLocationAction } = await import('@/app/admin/locations/actions');
    const result = await deleteLocationAction(VALID_UUID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.id).toBe(VALID_UUID);
    }
  });

  it('returns a validation error for an invalid UUID', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null }),
      },
    });

    const { deleteLocationAction } = await import('@/app/admin/locations/actions');
    const result = await deleteLocationAction('not-a-uuid');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid');
    }
  });

  it('blocks deletion when location is referenced by a booking', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const fromMock = vi.fn();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: fromMock,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null }),
      },
    });

    // Call 1: bookings returns a match
    fromMock.mockReturnValueOnce(
      makeMaybySingleChain({ data: { id: 'booking-1' }, error: null })
    );

    const { deleteLocationAction } = await import('@/app/admin/locations/actions');
    const result = await deleteLocationAction(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('booking');
    }
  });

  it('blocks deletion when location is referenced by a pricing rule', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const fromMock = vi.fn();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: fromMock,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null }),
      },
    });

    // Call 1: bookings check - no match
    fromMock.mockReturnValueOnce(makeMaybySingleChain({ data: null, error: null }));
    // Call 2: pricing_rules - match found
    fromMock.mockReturnValueOnce(
      makeMaybySingleChain({ data: { id: 'pricing-1' }, error: null })
    );

    const { deleteLocationAction } = await import('@/app/admin/locations/actions');
    const result = await deleteLocationAction(VALID_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('pricing');
    }
  });

  it('returns a generic error when the delete query fails', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const fromMock = vi.fn();
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: fromMock,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-id' } }, error: null }),
      },
    });

    // Call 1: bookings check - no match
    fromMock.mockReturnValueOnce(makeMaybySingleChain({ data: null, error: null }));
    // Call 2: pricing_rules check - no match
    fromMock.mockReturnValueOnce(makeMaybySingleChain({ data: null, error: null }));
    // Call 3: delete fails
    fromMock.mockReturnValueOnce(makeDeleteChain({ data: null, error: { message: 'DB error' } }));

    const { deleteLocationAction } = await import('@/app/admin/locations/actions');
    const result = await deleteLocationAction(VALID_UUID);

    expect(result.success).toBe(false);
  });
});
