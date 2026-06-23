import type { Booking } from '../models/Booking';
import { Notification } from '../models/Notification';
import { sendMail } from './email';
import { logger } from '../middleware/logger';

export async function logAdminBookingNotification(booking: Booking): Promise<Notification> {
  return Notification.create({
    recipientEmail: null,
    message: `New booking ${booking.referenceId} submitted by ${booking.customerName} (${booking.customerEmail}).`,
    type: 'admin_new_booking',
    readStatus: false,
  });
}

export async function notifyBookingStatusChange(
  booking: Booking,
  nextStatus: string,
): Promise<void> {
  await Notification.create({
    recipientEmail: booking.customerEmail,
    message: `Booking ${booking.referenceId} status changed to ${nextStatus}.`,
    type: 'customer_status_change',
    readStatus: false,
  });

  const subject = `Update on your booking ${booking.referenceId}`;
  const text = [
    `Hello ${booking.customerName},`,
    '',
    `Your booking ${booking.referenceId} has been updated to: ${nextStatus}.`,
    '',
    'Thank you for choosing Airport Transfers.',
  ].join('\n');

  try {
    await sendMail({ to: booking.customerEmail, subject, text });
  } catch (err) {
    logger.error(`Email dispatch failed for booking ${booking.referenceId}:`, err);
  }
}
