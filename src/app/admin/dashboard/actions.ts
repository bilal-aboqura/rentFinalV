'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createDriverSchema,
  updateDriverSchema,
  createLocationSchema,
  updateLocationSchema,
  createPricingRuleSchema,
  updatePricingRuleSchema,
  updateContentSchema,
  formatZodErrors,
} from '@/lib/validation/schema';
import type {
  ServerActionResponse,
  Booking,
  Driver,
  Location,
  PricingRule,
  Notification,
  Content,
  BookingStatus,
  BookingFilters,
  PaginatedResponse,
} from '@/types';
import {
  sendBookingStatusEmail,
} from '@/lib/email/nodemailer';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ----------------------------------------------------------------
// Auth Helper: Require authenticated admin
// ----------------------------------------------------------------
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/admin/login');
  }

  return { supabase, user };
}

// ----------------------------------------------------------------
// T019: Admin Login Action
// ----------------------------------------------------------------
export async function adminLoginAction(
  email: string,
  password: string
): Promise<ServerActionResponse<{ redirect: string }>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: 'Invalid email or password.' };
  }

  return { success: true, data: { redirect: '/admin/dashboard/bookings' } };
}

// ----------------------------------------------------------------
// Admin Logout Action
// ----------------------------------------------------------------
export async function adminLogoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

// ----------------------------------------------------------------
// T021: Fetch bookings with search, pagination, and status filters
// ----------------------------------------------------------------
export async function getBookingsAction(
  filters: BookingFilters = {}
): Promise<ServerActionResponse<PaginatedResponse<Booking>>> {
  await requireAdmin();
  const supabase = await createClient();

  const { search = '', status = 'all', page = 1, pageSize = 10 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('bookings')
    .select(
      '*, pickup_location:locations!bookings_pickup_location_id_fkey(id,name), destination_location:locations!bookings_destination_location_id_fkey(id,name), driver:drivers(id,name)',
      { count: 'exact' }
    );

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(
      `reference_id.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { success: false, error: error.message };
  }

  const total = count ?? 0;
  return {
    success: true,
    data: {
      data: data as Booking[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ----------------------------------------------------------------
// T022: Update booking status
// ----------------------------------------------------------------
export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus
): Promise<ServerActionResponse<Booking>> {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch current booking
  const { data: existing, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Booking not found.' };
  }

  // Update status
  const { data, error } = await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to update booking status.' };
  }

  // Trigger transactional email to customer
  if (status === 'Confirmed' || status === 'Cancelled' || status === 'Completed') {
    try {
      await sendBookingStatusEmail({
        customerName: existing.customer_name,
        customerEmail: existing.customer_email,
        referenceId: existing.reference_id,
        newStatus: status,
      });
    } catch {
      // Email failure should not block the status update
    }
  }

  // Create notification log
  await supabase.from('notifications').insert({
    message: `Booking ${existing.reference_id} status changed to ${status}`,
    type: 'customer_status_change',
    recipient_email: existing.customer_email,
    read_status: false,
  });

  revalidatePath('/admin/dashboard/bookings');
  return { success: true, data: data as Booking };
}

// ----------------------------------------------------------------
// T027: Assign driver to booking (with 3-hour overlap check)
// ----------------------------------------------------------------
export async function assignDriverAction(
  bookingId: string,
  driverId: string | null
): Promise<ServerActionResponse<Booking>> {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch the target booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return { success: false, error: 'Booking not found.' };
  }

  // If unassigning, skip conflict check
  if (driverId !== null) {
    // Verify driver is active
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('status')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return { success: false, error: 'Driver not found.' };
    }

    if (driver.status !== 'active') {
      return { success: false, error: 'Driver is not active and cannot be assigned.' };
    }

    // Check for 3-hour overlap
    const tripTime = new Date(booking.trip_date_time);
    const windowStart = new Date(tripTime.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date(tripTime.getTime() + 3 * 60 * 60 * 1000).toISOString();

    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id, reference_id, trip_date_time')
      .eq('driver_id', driverId)
      .neq('id', bookingId)
      .neq('status', 'Cancelled')
      .gte('trip_date_time', windowStart)
      .lte('trip_date_time', windowEnd);

    if (!conflictError && conflicts && conflicts.length > 0) {
      return {
        success: false,
        error:
          'Scheduling conflict: Driver is already assigned to another booking within 3 hours of this trip.',
      };
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ driver_id: driverId, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to assign driver.' };
  }

  revalidatePath('/admin/dashboard/bookings');
  return { success: true, data: data as Booking };
}

// ----------------------------------------------------------------
// T026: CRUD Server Actions for Drivers
// ----------------------------------------------------------------
export async function getDriversAction(): Promise<ServerActionResponse<Driver[]>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('name', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Driver[] };
}

export async function createDriverAction(
  input: unknown
): Promise<ServerActionResponse<Driver>> {
  await requireAdmin();
  const parsed = createDriverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed.', validationErrors: formatZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('drivers')
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      license_plate: parsed.data.licensePlate,
    })
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to create driver.' };
  revalidatePath('/admin/dashboard/drivers');
  return { success: true, data: data as Driver };
}

export async function updateDriverAction(
  input: unknown
): Promise<ServerActionResponse<Driver>> {
  await requireAdmin();
  const parsed = updateDriverSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed.', validationErrors: formatZodErrors(parsed.error) };
  }

  const { id, name, phone, licensePlate, status } = parsed.data;
  const supabase = await createClient();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (licensePlate !== undefined) updateData.license_plate = licensePlate;
  if (status !== undefined) updateData.status = status;

  const { data, error } = await supabase
    .from('drivers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to update driver.' };
  revalidatePath('/admin/dashboard/drivers');
  return { success: true, data: data as Driver };
}

export async function deleteDriverAction(
  driverId: string
): Promise<ServerActionResponse<{ id: string }>> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('drivers').delete().eq('id', driverId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/dashboard/drivers');
  return { success: true, data: { id: driverId } };
}

// ----------------------------------------------------------------
// T026: CRUD Server Actions for Locations
// ----------------------------------------------------------------
export async function getLocationsAction(): Promise<ServerActionResponse<Location[]>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Location[] };
}

export async function createLocationAction(
  input: unknown
): Promise<ServerActionResponse<Location>> {
  await requireAdmin();
  const parsed = createLocationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed.', validationErrors: formatZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .insert({ name: parsed.data.name, type: parsed.data.type })
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to create location.' };
  revalidatePath('/admin/dashboard/settings');
  return { success: true, data: data as Location };
}

export async function updateLocationAction(
  input: unknown
): Promise<ServerActionResponse<Location>> {
  await requireAdmin();
  const parsed = updateLocationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed.', validationErrors: formatZodErrors(parsed.error) };
  }

  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to update location.' };
  revalidatePath('/admin/dashboard/settings');
  return { success: true, data: data as Location };
}

// ----------------------------------------------------------------
// T026: CRUD Server Actions for Pricing Rules
// ----------------------------------------------------------------
export async function getPricingRulesAction(): Promise<ServerActionResponse<PricingRule[]>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*, pickup_location:locations!pricing_rules_pickup_location_id_fkey(id,name), destination_location:locations!pricing_rules_destination_location_id_fkey(id,name)')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as PricingRule[] };
}

export async function createPricingRuleAction(
  input: unknown
): Promise<ServerActionResponse<PricingRule>> {
  await requireAdmin();
  const parsed = createPricingRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed.', validationErrors: formatZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pricing_rules')
    .insert({
      pickup_location_id: parsed.data.pickupLocationId,
      destination_location_id: parsed.data.destinationLocationId,
      vehicle_class: parsed.data.vehicleClass,
      price: parsed.data.price,
    })
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to create pricing rule.' };
  revalidatePath('/admin/dashboard/settings');
  return { success: true, data: data as PricingRule };
}

export async function updatePricingRuleAction(
  input: unknown
): Promise<ServerActionResponse<PricingRule>> {
  await requireAdmin();
  const parsed = updatePricingRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed.', validationErrors: formatZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pricing_rules')
    .update({ price: parsed.data.price, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to update pricing rule.' };
  revalidatePath('/admin/dashboard/settings');
  return { success: true, data: data as PricingRule };
}

export async function deletePricingRuleAction(
  ruleId: string
): Promise<ServerActionResponse<{ id: string }>> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('pricing_rules').delete().eq('id', ruleId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/dashboard/settings');
  return { success: true, data: { id: ruleId } };
}

// ----------------------------------------------------------------
// T032: Notifications Actions
// ----------------------------------------------------------------
export async function getNotificationsAction(
  unreadOnly = false
): Promise<ServerActionResponse<Notification[]>> {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('read_status', false);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Notification[] };
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<ServerActionResponse<{ id: string }>> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_status: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/dashboard');
  return { success: true, data: { id: notificationId } };
}

export async function markAllNotificationsReadAction(): Promise<ServerActionResponse<{ count: number }>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_status: true, updated_at: new Date().toISOString() })
    .eq('read_status', false)
    .select('id');

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin/dashboard');
  return { success: true, data: { count: data?.length ?? 0 } };
}

// ----------------------------------------------------------------
// T035: Dynamic content update
// ----------------------------------------------------------------
export async function getContentAction(): Promise<ServerActionResponse<Content[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .order('key', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Content[] };
}

export async function updateContentAction(
  input: unknown
): Promise<ServerActionResponse<Content>> {
  await requireAdmin();
  const parsed = updateContentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed.', validationErrors: formatZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content')
    .update({ value: parsed.data.value, updated_at: new Date().toISOString() })
    .eq('key', parsed.data.key)
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message ?? 'Failed to update content.' };
  revalidatePath('/');
  revalidatePath('/admin/dashboard/content');
  return { success: true, data: data as Content };
}
