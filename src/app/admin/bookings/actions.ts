'use server';

import { createClient } from '@/lib/supabase/server';
import { BookingWithDetails, ServerActionResponse } from '@/types';
import { UpdateBookingStatusSchema, AssignDriverSchema } from '@/lib/validation/booking';

interface BookingRow {
  id: string;
  booking_reference: string;
  pickup_location_id: string;
  destination_location_id: string;
  booking_date: string;
  booking_time: string;
  price: string | number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  flight_number: string | null;
  notes: string | null;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  driver_id: string | null;
  created_at: string;
  pickup: { name: string } | null;
  destination: { name: string } | null;
  driver: { name: string } | null;
}

export async function fetchBookingsAction(input: {
  page: number;
  limit: number;
  statusFilter?: 'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
}): Promise<ServerActionResponse<{ bookings: BookingWithDetails[]; totalCount: number }>> {
  const { page, limit, statusFilter } = input;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    const supabase = await createClient();
    let query = supabase
      .from('bookings')
      .select('*, pickup:locations!pickup_location_id(name), destination:locations!destination_location_id(name), driver:drivers(name)', { count: 'exact' });

    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      return { success: false, error: `Failed to fetch bookings: ${error.message}` };
    }

    const bookings: BookingWithDetails[] = ((data as unknown as BookingRow[]) || []).map((row) => ({
      id: row.id,
      booking_reference: row.booking_reference,
      pickup_location_id: row.pickup_location_id,
      destination_location_id: row.destination_location_id,
      booking_date: row.booking_date,
      booking_time: row.booking_time,
      price: Number(row.price),
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      flight_number: row.flight_number,
      notes: row.notes,
      status: row.status,
      driver_id: row.driver_id,
      created_at: row.created_at,
      pickup: row.pickup ? { name: row.pickup.name } : { name: 'Unknown' },
      destination: row.destination ? { name: row.destination.name } : { name: 'Unknown' },
      driver: row.driver ? { name: row.driver.name } : null,
    }));

    return {
      success: true,
      data: {
        bookings,
        totalCount: count || 0,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: errorMsg };
  }
}

export async function updateBookingStatusAction(
  input: unknown
): Promise<ServerActionResponse<BookingWithDetails>> {
  const validation = UpdateBookingStatusSchema.safeParse(input);
  if (!validation.success) {
    const validationErrors: { [key: string]: string[] } = {};
    validation.error.issues.forEach(issue => {
      const path = issue.path[0] as string;
      if (!validationErrors[path]) {
        validationErrors[path] = [];
      }
      validationErrors[path].push(issue.message);
    });
    return { success: false, validationErrors };
  }

  const { bookingId, status } = validation.data;

  try {
    const supabase = await createClient();

    // Enforce terminal status lock
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !currentBooking) {
      return { success: false, error: 'Booking not found.' };
    }

    if (currentBooking.status === 'Completed' || currentBooking.status === 'Cancelled') {
      return {
        success: false,
        error: 'Cannot modify a booking that is in a terminal state (Completed or Cancelled).',
      };
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select('*, pickup:locations!pickup_location_id(name), destination:locations!destination_location_id(name), driver:drivers(name)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const row = data as unknown as BookingRow;

    return {
      success: true,
      data: {
        id: row.id,
        booking_reference: row.booking_reference,
        pickup_location_id: row.pickup_location_id,
        destination_location_id: row.destination_location_id,
        booking_date: row.booking_date,
        booking_time: row.booking_time,
        price: Number(row.price),
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
        flight_number: row.flight_number,
        notes: row.notes,
        status: row.status,
        driver_id: row.driver_id,
        created_at: row.created_at,
        pickup: row.pickup ? { name: row.pickup.name } : { name: 'Unknown' },
        destination: row.destination ? { name: row.destination.name } : { name: 'Unknown' },
        driver: row.driver ? { name: row.driver.name } : null,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: errorMsg };
  }
}

export async function assignDriverAction(
  input: unknown
): Promise<ServerActionResponse<BookingWithDetails>> {
  const validation = AssignDriverSchema.safeParse(input);
  if (!validation.success) {
    const validationErrors: { [key: string]: string[] } = {};
    validation.error.issues.forEach(issue => {
      const path = issue.path[0] as string;
      if (!validationErrors[path]) {
        validationErrors[path] = [];
      }
      validationErrors[path].push(issue.message);
    });
    return { success: false, validationErrors };
  }

  const { bookingId, driverId } = validation.data;

  try {
    const supabase = await createClient();

    // Enforce terminal status lock
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !currentBooking) {
      return { success: false, error: 'Booking not found.' };
    }

    if (currentBooking.status === 'Completed' || currentBooking.status === 'Cancelled') {
      return {
        success: false,
        error: 'Cannot modify a booking that is in a terminal state (Completed or Cancelled).',
      };
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ driver_id: driverId })
      .eq('id', bookingId)
      .select('*, pickup:locations!pickup_location_id(name), destination:locations!destination_location_id(name), driver:drivers(name)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const row = data as unknown as BookingRow;

    return {
      success: true,
      data: {
        id: row.id,
        booking_reference: row.booking_reference,
        pickup_location_id: row.pickup_location_id,
        destination_location_id: row.destination_location_id,
        booking_date: row.booking_date,
        booking_time: row.booking_time,
        price: Number(row.price),
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
        flight_number: row.flight_number,
        notes: row.notes,
        status: row.status,
        driver_id: row.driver_id,
        created_at: row.created_at,
        pickup: row.pickup ? { name: row.pickup.name } : { name: 'Unknown' },
        destination: row.destination ? { name: row.destination.name } : { name: 'Unknown' },
        driver: row.driver ? { name: row.driver.name } : null,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: errorMsg };
  }
}

export async function fetchActiveDriversAction(): Promise<ServerActionResponse<{ id: string; name: string; availability_status: string }[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('drivers')
      .select('id, name, availability_status')
      .in('availability_status', ['Available', 'Busy'])
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const formattedData = (data || []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      availability_status: String(row.availability_status),
    }));

    return { success: true, data: formattedData };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: errorMsg };
  }
}
