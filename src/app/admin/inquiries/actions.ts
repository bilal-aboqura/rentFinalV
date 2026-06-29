'use server';

/**
 * Spec 010 (F-10) — Contact Inquiries Admin Server Actions
 *
 * Contract: specs/010-contact-inquiries/contracts/server-actions.md
 *
 * Exports:
 * - fetchInquiriesAction()         — paginated inquiries list, newest first (US2)
 * - updateInquiryStatusAction()    — status transition Unread/Read/Resolved (US3)
 * - getUnreadInquiriesCount()      — unread count for the AdminNavbar badge (US4)
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ServerActionResponse } from '@/types';
import {
  UpdateInquiryStatusSchema,
  formatContactZodErrors,
  type ContactInquiry,
} from '@/lib/validation/contact';

/** Unauthorized error response shared by every admin action. */
function unauthorized(): ServerActionResponse<never> {
  return { success: false, error: 'Unauthorized. Administrator access required.' };
}

/**
 * Resolves the authenticated Supabase client or null when the caller is not an admin.
 * Mirrors the authorization strategy in specs/010-contact-inquiries/research.md (Decision 3).
 */
async function getAdminClient(): Promise<
  { authorized: true; supabase: Awaited<ReturnType<typeof createClient>> } | { authorized: false }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false };
  }
  return { authorized: true, supabase };
}

// ----------------------------------------------------------------
// US2 — Fetch inquiries with server-side pagination, newest first
// ----------------------------------------------------------------

export async function fetchInquiriesAction(input: {
  page: number;
  limit: number;
}): Promise<ServerActionResponse<{ inquiries: ContactInquiry[]; totalCount: number }>> {
  const session = await getAdminClient();
  if (!session.authorized) {
    return unauthorized();
  }
  const { supabase } = session;

  // Clamp and normalize pagination inputs.
  const page = Math.max(1, Math.floor(input.page));
  const limit = Math.max(1, Math.floor(input.limit));
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data, count, error } = await supabase
    .from('contact_inquiries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, end);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      inquiries: (data ?? []) as unknown as ContactInquiry[],
      totalCount: count ?? 0,
    },
  };
}

// ----------------------------------------------------------------
// US3 — Update inquiry status (Unread / Read / Resolved)
// ----------------------------------------------------------------

export async function updateInquiryStatusAction(
  input: unknown
): Promise<ServerActionResponse<ContactInquiry>> {
  const session = await getAdminClient();
  if (!session.authorized) {
    return unauthorized();
  }
  const { supabase } = session;

  const parsed = UpdateInquiryStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid inquiry ID or status selection.',
      validationErrors: formatContactZodErrors(parsed.error),
    };
  }
  const { inquiryId, status } = parsed.data;

  const { data: updated, error } = await supabase
    .from('contact_inquiries')
    .update({ status })
    .eq('id', inquiryId)
    .select('*')
    .single();

  if (error || !updated) {
    // PGRST116 → no row matched the supplied id.
    if (error && error.code === 'PGRST116') {
      return { success: false, error: 'Inquiry not found.' };
    }
    return {
      success: false,
      error: error?.message ?? 'Failed to update inquiry status.',
    };
  }

  revalidatePath('/admin/inquiries');

  return { success: true, data: updated as unknown as ContactInquiry };
}

// ----------------------------------------------------------------
// US4 — Unread inquiries count (AdminNavbar badge)
// ----------------------------------------------------------------

/**
 * Returns the total number of inquiries currently in the 'Unread' state.
 * Uses a head-only exact count query for high performance (no rows fetched).
 * Rendered as a badge in the shared AdminNavbar.
 */
export async function getUnreadInquiriesCount(): Promise<
  ServerActionResponse<{ count: number }>
> {
  const session = await getAdminClient();
  if (!session.authorized) {
    return unauthorized();
  }
  const { supabase } = session;

  const { count, error } = await supabase
    .from('contact_inquiries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Unread');

  if (error) {
    return {
      success: false,
      error: `Failed to retrieve unread inquiry count: ${error.message}`,
    };
  }

  return { success: true, data: { count: count ?? 0 } };
}
