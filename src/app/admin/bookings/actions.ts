'use server';

/**
 * Spec 007: Bookings Management Dashboard — Server Actions
 *
 * Contracts: specs/007-bookings-dashboard/contracts/booking-actions.md
 *
 * Exports:
 * - fetchBookingsAction()        — paginated, filterable bookings list (US1)
 * - updateBookingStatusAction()  — status transition with terminal lock (US2)
 * - assignDriverAction()         — driver assignment with terminal lock (US3)
 * - fetchActiveDriversAction()   — active drivers for the assignment dropdown (US3)
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ServerActionResponse } from '@/types';
import {
  UpdateBookingStatusSchema,
  AssignDriverSchema,
  isTerminalBookingStatus,
  type BookingWithDetails,
  type BookingStatus,
  type BookingStatusFilter,
} from '@/lib/validation/booking';

/** Select string used to load a booking with its joined route + driver names. */
const BOOKING_WITH_DETAILS_SELECT =
  '*, pickup:locations!pickup_location_id(name), destination:locations!destination_location_id(name), driver:drivers(name)';

/** Unauthorized error response shared by every admin action. */
function unauthorized(): ServerActionResponse<never> {
  return { success: false, error: 'Unauthorized. Administrator access required.' };
}

/** Terminal lock error returned when modifying a Completed/Cancelled booking. */
const TERMINAL_LOCK_ERROR =
  'Cannot modify a booking that is in a terminal state (Completed or Cancelled).';

/**
 * Resolves the authenticated Supabase client or null when the caller is not an admin.
 * Mirrors the authorization strategy documented in research.md (Decision 2).
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
// US1 — Fetch bookings with server-side pagination & status filtering
// ----------------------------------------------------------------

export async function fetchBookingsAction(input: {
  page: number;
  limit: number;
  statusFilter?: BookingStatusFilter;
}): Promise<ServerActionResponse<{ bookings: BookingWithDetails[]; totalCount: number }>> {
  const session = await getAdminClient();
  if (!session.authorized) {
    return unauthorized();
  }
  const { supabase } = session;

  // Clamp and normalize pagination inputs.
  const page = Math.max(1, Math.floor(input.page));
  const limit = Math.max(1, Math.floor(input.limit));
  const statusFilter: BookingStatusFilter = input.statusFilter ?? 'All';

  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase
    .from('bookings')
    .select(BOOKING_WITH_DETAILS_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (statusFilter !== 'All') {
    query = query.eq('status', statusFilter);
  }

  const { data, count, error } = await query.range(start, end);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      bookings: (data ?? []) as unknown as BookingWithDetails[],
      totalCount: count ?? 0,
    },
  };
}

// ----------------------------------------------------------------
// US2 — Update booking status (with terminal state lock)
// ----------------------------------------------------------------

export async function updateBookingStatusAction(input: {
  bookingId: string;
  status: BookingStatus;
}): Promise<ServerActionResponse<BookingWithDetails>> {
  const session = await getAdminClient();
  if (!session.authorized) {
    return unauthorized();
  }
  const { supabase } = session;

  const parsed = UpdateBookingStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid booking ID or status selection.' };
  }
  const { bookingId, status } = parsed.data;

  // Load current status to enforce the terminal-state lock.
  const { data: currentBooking, error: fetchError } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !currentBooking) {
    return { success: false, error: 'Booking not found.' };
  }

  if (isTerminalBookingStatus(currentBooking.status)) {
    return { success: false, error: TERMINAL_LOCK_ERROR };
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select(BOOKING_WITH_DETAILS_SELECT)
    .single();

  if (updateError || !updated) {
    return { success: false, error: updateError?.message ?? 'Failed to update booking status.' };
  }

  revalidatePath('/admin/bookings');
  return { success: true, data: updated as unknown as BookingWithDetails };
}

// ----------------------------------------------------------------
// US3 — Assign (or unassign) a driver to a booking (terminal lock)
// ----------------------------------------------------------------

export async function assignDriverAction(input: {
  bookingId: string;
  driverId: string | null;
}): Promise<ServerActionResponse<BookingWithDetails>> {
  const session = await getAdminClient();
  if (!session.authorized) {
    return unauthorized();
  }
  const { supabase } = session;

  const parsed = AssignDriverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid booking ID or driver ID.' };
  }
  const { bookingId, driverId } = parsed.data;

  // Load current status to enforce the terminal-state lock.
  const { data: currentBooking, error: fetchError } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !currentBooking) {
    return { success: false, error: 'Booking not found.' };
  }

  if (isTerminalBookingStatus(currentBooking.status)) {
    return { success: false, error: TERMINAL_LOCK_ERROR };
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ driver_id: driverId })
    .eq('id', bookingId)
    .select(BOOKING_WITH_DETAILS_SELECT)
    .single();

  if (updateError || !updated) {
    return { success: false, error: updateError?.message ?? 'Failed to assign driver.' };
  }

  revalidatePath('/admin/bookings');
  return { success: true, data: updated as unknown as BookingWithDetails };
}

// ----------------------------------------------------------------
// US3 (supporting) — Active drivers for the assignment dropdown
// ----------------------------------------------------------------

export interface ActiveDriverOption {
  id: string;
  name: string;
}

export async function fetchActiveDriversAction(): Promise<
  ServerActionResponse<ActiveDriverOption[]>
> {
  const session = await getAdminClient();
  if (!session.authorized) {
    return unauthorized();
  }
  const { supabase } = session;

  const { data, error } = await supabase
    .from('drivers')
    .select('id, name')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data ?? []) as ActiveDriverOption[] };
}

// ----------------------------------------------------------------
// Spec 008 / US2 — Pending bookings count (T007)
// Contract: specs/008-new-request-alert/contracts/alert-contracts.md
// ----------------------------------------------------------------

/**
 * Returns the total number of bookings currently in the 'Pending' state.
 * Uses a head-only exact count query for high performance (no rows fetched).
 * Rendered as a badge in the shared AdminNavbar.
 */
export async function getPendingBookingsCount(): Promise<
  ServerActionResponse<{ count: number }>
> {
  const session = await getAdminClient();
  if (!session.authorized) {
    return unauthorized();
  }
  const { supabase } = session;

  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending');

  if (error) {
    return {
      success: false,
      error: `Failed to retrieve pending booking count: ${error.message}`,
    };
  }

  return { success: true, data: { count: count ?? 0 } };
}
