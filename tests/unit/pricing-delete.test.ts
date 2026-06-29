/**
 * T018 [US4] - Vitest mock tests for deleteRoutePriceAction.
 *
 * Spec: specs/003-pricing-management/contracts/actions.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const RULE_UUID = '770e8400-e29b-41d4-a716-446655440000';

const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null }),
    },
    from: mockFrom,
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

describe('deleteRoutePriceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSingle.mockResolvedValue({
      data: { id: RULE_UUID },
      error: null,
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });
  });

  it('should delete a pricing rule successfully', async () => {
    const { deleteRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await deleteRoutePriceAction(RULE_UUID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.id).toBe(RULE_UUID);
    }
  });

  it('should reject invalid UUID', async () => {
    const { deleteRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await deleteRoutePriceAction('not-a-uuid');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid');
    }
  });

  it('should handle database error gracefully', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Row not found' },
    });

    const { deleteRoutePriceAction } = await import('@/app/admin/pricing/actions');

    const result = await deleteRoutePriceAction(RULE_UUID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
