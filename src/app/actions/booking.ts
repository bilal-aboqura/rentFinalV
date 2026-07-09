'use server';

/**
 * Transfer booking server actions.
 *
 * - submitBookingRequestAction(): validates, verifies price server-side,
 *   persists the booking (admin dashboard), creates an admin
 *   notification, dispatches the admin email (non-fatal), and returns
 *   a prefilled WhatsApp URL so the customer can send the details to
 *   the business owner instantly.
 *
 * Pricing is read from `pricing_rules` keyed on
 * (pickup_location_id, destination_location_id, vehicle_class).
 */

import { createServiceClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/app/actions/cms';
import { verifyRoutePriceAction } from '@/app/actions/pricing';
import { TransferBookingSchema } from '@/lib/validation/transfer';
import { buildWhatsappMessage, buildWhatsappUrl } from '@/lib/whatsapp/buildMessage';
import { sendWhatsAppAdminNotification } from '@/lib/whatsapp/notify';
import { sendAdminNotificationEmail } from '@/lib/mail/smtp';
import type { BookingHospitalitySelection, ServerActionResponse, VehicleClass } from '@/types';

function generateReferenceId(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AT-${stamp}${rand}`;
}

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

interface LocationNameRow {
  id: string;
  name: string;
}

interface HospitalityOptionRow {
  id: string;
  name: string;
  name_ar: string;
  is_active: boolean;
}

export interface SubmitBookingSuccess {
  bookingReference: string;
  whatsappUrl: string;
  whatsappDelivered: boolean;
}

export async function submitBookingRequestAction(
  payload: unknown,
): Promise<ServerActionResponse<SubmitBookingSuccess>> {
  const parsed = TransferBookingSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return {
      success: false,
      error: 'Validation failed.',
      validationErrors: fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const supabase = await createServiceClient();

    const outboundPrice = await verifyRoutePriceAction(
      data.pickup.locationId,
      data.dropoff.locationId,
      data.vehicleClass,
    );

    if (outboundPrice === null) {
      return {
        success: false,
        error: 'No pricing is available for this route.',
        validationErrors: { pickup: ['No pricing is available for this route.'] },
      };
    }

    let returnPrice = 0;
    if (data.tripType === 'round_trip') {
      const reverse = await verifyRoutePriceAction(
        data.returnPickup?.locationId ?? data.dropoff.locationId,
        data.returnDropoff?.locationId ?? data.pickup.locationId,
        data.vehicleClass,
      );
      returnPrice = reverse ?? outboundPrice;
    }

    const totalPrice = outboundPrice + returnPrice;

    if (Math.abs(totalPrice - data.price) > 1) {
      return {
        success: false,
        error: 'Price verification failed.',
        validationErrors: { price: ['Price verification failed. Please refresh and try again.'] },
      };
    }

    const locationIds = Array.from(
      new Set([
        data.pickup.locationId,
        data.dropoff.locationId,
        ...(data.returnPickup?.locationId ? [data.returnPickup.locationId] : []),
        ...(data.returnDropoff?.locationId ? [data.returnDropoff.locationId] : []),
      ]),
    );

    const { data: locationRows } = (await supabase
      .from('locations')
      .select('id, name')
      .in('id', locationIds)) as { data: LocationNameRow[] | null };

    const locationNameById = new Map<string, string>(
      (locationRows ?? []).map((row) => [row.id, row.name]),
    );

    const pickupName = locationNameById.get(data.pickup.locationId) ?? 'Unknown';
    const dropoffName = locationNameById.get(data.dropoff.locationId) ?? 'Unknown';
    const returnPickupName =
      locationNameById.get(data.returnPickup?.locationId ?? '') ?? dropoffName;
    const returnDropoffName =
      locationNameById.get(data.returnDropoff?.locationId ?? '') ?? pickupName;

    const { data: carRow } = await supabase
      .from('cars')
      .select('name, name_ar')
      .eq('id', data.carId)
      .maybeSingle();

    const carName =
      (carRow && (data.language === 'ar' ? carRow.name_ar : carRow.name)) || 'Car';

    const hospitalitySelectionsSnapshot: BookingHospitalitySelection[] = [];
    if (data.hospitalitySelections.length > 0) {
      const selectedHospitalityIds = data.hospitalitySelections.map((selection) => selection.optionId);
      const { data: hospitalityRows, error: hospitalityError } = (await supabase
        .from('hospitality_options')
        .select('id, name, name_ar, is_active')
        .in('id', selectedHospitalityIds)) as {
        data: HospitalityOptionRow[] | null;
        error: { message: string } | null;
      };

      if (hospitalityError) {
        return { success: false, error: 'Failed to validate hospitality options.' };
      }

      const hospitalityMap = new Map<string, HospitalityOptionRow>(
        (hospitalityRows ?? []).map((row) => [row.id, row]),
      );

      for (const selection of data.hospitalitySelections) {
        const option = hospitalityMap.get(selection.optionId);
        if (!option || !option.is_active) {
          return {
            success: false,
            error: 'Invalid hospitality selection.',
            validationErrors: {
              hospitalitySelections: ['One or more hospitality items are unavailable.'],
            },
          };
        }

        if (selection.quantity > data.passengerCount) {
          return {
            success: false,
            error: 'Hospitality quantity exceeds passenger count.',
            validationErrors: {
              hospitalitySelections: ['Hospitality quantities cannot exceed passenger count.'],
            },
          };
        }

        hospitalitySelectionsSnapshot.push({
          option_id: option.id,
          name: option.name,
          name_ar: option.name_ar,
          quantity: selection.quantity,
        });
      }
    }

    const referenceId = generateReferenceId();
    const tripDateTime = combineDateTime(data.date, data.time);
    const returnDateTime =
      data.tripType === 'round_trip' && data.returnDate && data.returnTime
        ? combineDateTime(data.returnDate, data.returnTime)
        : null;

    const insertRow = {
      reference_id: referenceId,
      pickup_location_id: data.pickup.locationId,
      destination_location_id: data.dropoff.locationId,
      trip_date_time: tripDateTime,
      vehicle_class: data.vehicleClass as VehicleClass,
      customer_name: data.customerName,
      customer_email: data.customerEmail?.trim() || null,
      customer_phone: data.customerPhone,
      total_price: totalPrice,
      status: 'Pending',
      trip_type: data.tripType,
      pickup_type: data.pickup.type,
      pickup_text: data.pickup.text?.trim() ?? '',
      dropoff_type: data.dropoff.type,
      dropoff_text: data.dropoff.text?.trim() ?? '',
      flight_number: data.flightNumber?.trim() || null,
      ticket_number: data.flightNumber?.trim() || '',
      return_date_time: returnDateTime,
      return_pickup_location_id: data.returnPickup?.locationId ?? null,
      return_destination_location_id: data.returnDropoff?.locationId ?? null,
      return_flight_number: data.returnFlightNumber?.trim() || null,
      car_id: data.carId,
      language: data.language,
      notes: data.notes?.trim() || null,
      payment_method: data.paymentMethod,
      passenger_count: data.passengerCount,
      hospitality_selections: hospitalitySelectionsSnapshot,
      departure_airport: data.pickup.type === 'airport' ? pickupName : '',
      arrival_airport: data.dropoff.type === 'airport' ? dropoffName : '',
      vehicle_name: carName,
    };

    const { error: insertError } = await supabase.from('bookings').insert(insertRow);

    if (insertError) {
      console.error('[submitBookingRequestAction] DB insert error:', insertError);
      return { success: false, error: 'Failed to save booking. Please try again later.' };
    }

    await supabase.from('notifications').insert({
      message: `New booking ${referenceId} - ${data.customerName} (${pickupName} -> ${dropoffName})`,
      type: 'admin_new_booking',
      read_status: false,
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      void sendAdminNotificationEmail({
        reference: referenceId,
        pickupName,
        destinationName: dropoffName,
        date: data.date,
        time: data.time,
        customerName: data.customerName,
        adminEmail,
      });
    }

    const settings = await getSiteSettings();
    const message = buildWhatsappMessage({
      language: data.language,
      referenceId,
      tripType: data.tripType,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail ?? null,
      pickupLabel: pickupName,
      pickupDetail: data.pickup.text ?? '',
      dropoffLabel: dropoffName,
      dropoffDetail: data.dropoff.text ?? '',
      date: data.date,
      time: data.time,
      flightNumber: data.flightNumber ?? null,
      returnDate: data.returnDate ?? null,
      returnTime: data.returnTime ?? null,
      returnFlightNumber: data.returnFlightNumber ?? null,
      returnPickupLabel: returnPickupName,
      returnPickupDetail: data.returnPickup?.text ?? '',
      returnDropoffLabel: returnDropoffName,
      returnDropoffDetail: data.returnDropoff?.text ?? '',
      carName,
      passengerCount: data.passengerCount,
      hospitalitySelections: hospitalitySelectionsSnapshot,
      price: totalPrice,
      paymentMethod: data.paymentMethod,
      notes: data.notes ?? null,
    });

    const whatsappDelivery = await sendWhatsAppAdminNotification({
      to: settings.whatsapp_number,
      message,
    });

    if (!whatsappDelivery.delivered && whatsappDelivery.error) {
      console.warn('[submitBookingRequestAction] WhatsApp delivery fallback:', whatsappDelivery.error);
    }

    const whatsappUrl = buildWhatsappUrl(settings.whatsapp_number, message);

    return {
      success: true,
      data: {
        bookingReference: referenceId,
        whatsappUrl,
        whatsappDelivered: whatsappDelivery.delivered,
      },
    };
  } catch (error) {
    console.error('[submitBookingRequestAction] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again later.' };
  }
}
