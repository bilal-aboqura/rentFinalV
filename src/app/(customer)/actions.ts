'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createBookingSchema,
  formatZodErrors,
} from '@/lib/validation/schema';
import type {
  ServerActionResponse,
  Location,
  PricingRule,
  Booking,
} from '@/types';
import { sendBookingStatusEmail } from '@/lib/email/nodemailer';
import { revalidatePath } from 'next/cache';

// ----------------------------------------------------------------
// Helper: Generate booking reference ID
// ----------------------------------------------------------------
function generateReferenceId(): string {
  return `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// ----------------------------------------------------------------
// T011: Fetch active locations
// ----------------------------------------------------------------
export async function getActiveLocationsAction(): Promise<
  ServerActionResponse<Location[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: data as Location[] };
}

// ----------------------------------------------------------------
// T012: Query route pricing rules
// ----------------------------------------------------------------
export async function getRoutePricingAction(
  pickupLocationId: string,
  destinationLocationId: string
): Promise<ServerActionResponse<PricingRule[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('pickup_location_id', pickupLocationId)
    .eq('destination_location_id', destinationLocationId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: data as PricingRule[] };
}

// ----------------------------------------------------------------
// T013: Create booking request
// ----------------------------------------------------------------
export async function createBookingAction(
  input: unknown
): Promise<ServerActionResponse<Booking>> {
  // Validate input
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed.',
      validationErrors: formatZodErrors(parsed.error),
    };
  }

  const {
    pickupLocationId,
    destinationLocationId,
    tripDateTime,
    vehicleClass,
    customerName,
    customerEmail,
    customerPhone,
  } = parsed.data;

  const supabase = await createClient();

  // Look up the flat-rate price for this route & vehicle class
  const { data: pricingData, error: pricingError } = await supabase
    .from('pricing_rules')
    .select('price')
    .eq('pickup_location_id', pickupLocationId)
    .eq('destination_location_id', destinationLocationId)
    .eq('vehicle_class', vehicleClass)
    .single();

  if (pricingError || !pricingData) {
    return {
      success: false,
      error:
        'No pricing available for the selected route and vehicle class. Please choose another combination.',
    };
  }

  const totalPrice = Number(pricingData.price);

  // Insert the booking
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      reference_id: generateReferenceId(),
      pickup_location_id: pickupLocationId,
      destination_location_id: destinationLocationId,
      trip_date_time: tripDateTime,
      vehicle_class: vehicleClass,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      total_price: totalPrice,
      status: 'pending',
    })
    .select()
    .single();

  if (bookingError || !bookingData) {
    return { success: false, error: bookingError?.message ?? 'Failed to create booking.' };
  }

  // Create admin notification
  await supabase.from('notifications').insert({
    message: `New booking received: ${bookingData.reference_id} from ${customerName}`,
    type: 'admin_new_booking',
    recipient_email: null,
    read_status: false,
  });

  revalidatePath('/admin/dashboard/bookings');

  return { success: true, data: bookingData as Booking };
}

// ----------------------------------------------------------------
// T016: Guest contact message submission
// Moved to specs/010-contact-inquiries: src/app/actions/contact.ts
// (submitContactForm) — persisted to the dedicated contact_inquiries table.
// ----------------------------------------------------------------
