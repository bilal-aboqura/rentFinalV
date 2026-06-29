import { Notification } from '../models/index.js';
import { sendBookingStatusEmail } from './email.js';
import type { BookingStatus } from '../types/index.js';

export interface BookingLike {
  id: number;
  reference_id: string;
  customer_name: string;
  customer_email: string;
}

export async function notifyAdminNewBooking(booking: BookingLike): Promise<void> {
  await Notification.create({
    type: 'admin_new_booking',
    recipient_email: null,
    message: `New booking ${booking.reference_id} submitted by ${booking.customer_name}.`,
  });
}

export async function notifyCustomerStatusChange(
  booking: BookingLike,
  newStatus: BookingStatus,
): Promise<void> {
  await Notification.create({
    type: 'customer_status_change',
    recipient_email: booking.customer_email,
    message: `Booking ${booking.reference_id} status changed to ${newStatus}.`,
  });

  await sendBookingStatusEmail(
    booking.customer_email,
    booking.reference_id,
    newStatus,
  );
}
