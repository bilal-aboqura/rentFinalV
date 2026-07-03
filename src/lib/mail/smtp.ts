/**
 * T006 — SMTP Transactional Email Utility
 *
 * Spec: specs/006-booking-wizard-step2/plan.md
 *
 * Provides sendBookingConfirmationEmail() to dispatch a transactional
 * confirmation email to the passenger after a booking is created.
 *
 * Uses nodemailer configured from environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

import nodemailer from 'nodemailer';

// ─────────────────────────────────────────────────────────────
// SMTP Transporter
// ─────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface BookingConfirmationPayload {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  pickupLocationName: string;
  destinationLocationName: string;
  bookingDate: string;   // YYYY-MM-DD
  bookingTime: string;   // HH:mm
  price: number;
  flightNumber?: string | null;
  notes?: string | null;
}

// ─────────────────────────────────────────────────────────────
// Send booking confirmation email
// ─────────────────────────────────────────────────────────────

/**
 * Dispatches a transactional HTML email to the passenger confirming
 * their booking request and providing their unique booking reference.
 *
 * Failures are intentionally non-fatal: the booking is already saved
 * to the database. SMTP errors are logged and do not throw to callers.
 */
export async function sendBookingConfirmationEmail(
  payload: BookingConfirmationPayload
): Promise<void> {
  const {
    bookingReference,
    customerName,
    customerEmail,
    pickupLocationName,
    destinationLocationName,
    bookingDate,
    bookingTime,
    price,
    flightNumber,
    notes,
  } = payload;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);

  try {
    await transporter.sendMail({
      from: `"دقه الوقت" <${process.env.SMTP_FROM ?? 'noreply@airtransfer.com'}>`,
      to: customerEmail,
      subject: `Booking Request Received — ${bookingReference}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Booking Request Received</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">We have received your transfer request.</p>
          </div>

          <div style="background: white; padding: 32px 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            <p style="color: #334155; margin-top: 0;">Dear <strong>${customerName}</strong>,</p>
            <p style="color: #475569;">Your airport transfer booking request has been received and is pending confirmation. Here are your trip details:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="background: #f1f5f9;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; width: 40%;">Reference</td>
                <td style="padding: 12px 16px; color: #1e293b; font-family: monospace; font-size: 13px;">${bookingReference}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Pickup</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${pickupLocationName}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Destination</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${destinationLocationName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Date &amp; Time</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${bookingDate} at ${bookingTime}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Price</td>
                <td style="padding: 12px 16px; color: #16a34a; font-weight: 700; border-top: 1px solid #e2e8f0;">${formattedPrice}</td>
              </tr>
              ${flightNumber ? `<tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Flight Number</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${flightNumber}</td>
              </tr>` : ''}
              ${notes ? `<tr style="background: #f8fafc;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Notes</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${notes}</td>
              </tr>` : ''}
            </table>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0; color: #1d4ed8; font-size: 14px;">
                <strong>Status: Pending Confirmation</strong><br>
                Our team will review your request and confirm your transfer shortly.
              </p>
            </div>

            <p style="color: #475569; font-size: 14px; margin-top: 24px;">
              Questions? Contact us or reply to this email.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    // SMTP failures are logged but must NOT abort the booking flow.
    // The database record is already saved at this point.
    console.error('[smtp] Failed to send booking confirmation email:', error);
  }
}

// ─────────────────────────────────────────────────────────────
// T004 [US1] — Send admin "New Booking Request" notification email
// Spec: specs/008-new-request-alert/contracts/alert-contracts.md
// ─────────────────────────────────────────────────────────────

export interface AdminNotificationPayload {
  reference: string;
  pickupName: string;
  destinationName: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  customerName: string;
  adminEmail: string;
}

/**
 * Dispatches a "New Booking Request" alert email to the administrator
 * whenever a customer submits a new booking.
 *
 * Formats both a plain-text and an HTML template containing the booking
 * details and a deep link to the admin bookings panel.
 *
 * Failures are intentionally non-fatal: errors are caught, logged, and
 * `null` is returned so the customer checkout flow is never interrupted.
 */
export async function sendAdminNotificationEmail(
  params: AdminNotificationPayload
): Promise<null> {
  const {
    reference,
    pickupName,
    destinationName,
    date,
    time,
    customerName,
    adminEmail,
  } = params;

  const adminUrl = `/admin/bookings?ref=${reference}`;
  const subject = `New Booking Request — ${reference}`;

  const text = [
    'New Booking Request',
    '',
    `Reference: ${reference}`,
    `Customer:  ${customerName}`,
    `Route:     ${pickupName} → ${destinationName}`,
    `Date:      ${date} at ${time}`,
    '',
    `Review it in the admin panel: ${adminUrl}`,
  ].join('\n');

  try {
    await transporter.sendMail({
      from: `"دقه الوقت" <${process.env.SMTP_FROM ?? 'noreply@airtransfer.com'}>`,
      to: adminEmail,
      subject,
      text,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #b91c1c, #dc2626); padding: 32px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Booking Request</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">A customer has submitted a new transfer request.</p>
          </div>

          <div style="background: white; padding: 32px 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="background: #f1f5f9;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; width: 40%;">Reference</td>
                <td style="padding: 12px 16px; color: #1e293b; font-family: monospace; font-size: 13px;">${reference}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Customer</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${customerName}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Route</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${pickupName} &rarr; ${destinationName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Date &amp; Time</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${date} at ${time}</td>
              </tr>
            </table>

            <div style="text-align: center; margin-top: 8px;">
              <a href="${adminUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 8px;">View Booking in Admin Panel</a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    // Non-fatal: must not interrupt the guest checkout flow.
    console.warn('[smtp] Failed to send admin notification email:', error);
    return null;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Spec 009 / US1 & US2 — Status Change Alert emails
// Contract: specs/009-status-change-alert/contracts/smtp.md
// ─────────────────────────────────────────────────────────────

export interface SendBookingConfirmedEmailParams {
  email: string;
  customerName: string;
  reference: string;
  pickupName: string;
  destinationName: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
  driverName?: string;
  driverPhone?: string;
}

export interface SendBookingCancelledEmailParams {
  email: string;
  customerName: string;
  reference: string;
}

/**
 * Dispatches a "Booking Confirmed" transactional email to the guest
 * customer, including the trip details and the assigned driver's
 * name and phone number when available.
 *
 * When no driver is assigned yet, the email states that a driver will
 * be assigned soon (FR-008). Failures are non-fatal: SMTP errors are
 * logged and `null` is returned so the status update is never rolled back.
 */
export async function sendBookingConfirmedEmail(
  params: SendBookingConfirmedEmailParams
): Promise<null> {
  const {
    email,
    customerName,
    reference,
    pickupName,
    destinationName,
    date,
    time,
    driverName,
    driverPhone,
  } = params;

  const hasDriver = Boolean(driverName);

  const driverRow = hasDriver
    ? `
              <tr style="background: #f8fafc;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Driver</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${driverName}${driverPhone ? ` &middot; ${driverPhone}` : ''}</td>
              </tr>`
    : '';

  const statusBanner = hasDriver
    ? `<div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0; color: #047857; font-size: 14px;">
                <strong>Your ride is confirmed!</strong><br>
                Your driver will meet you at the pickup location.
              </p>
            </div>`
    : `<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0; color: #1d4ed8; font-size: 14px;">
                <strong>Your ride is confirmed!</strong><br>
                A driver will be assigned to your booking soon.
              </p>
            </div>`;

  try {
    await transporter.sendMail({
      from: `"دقه الوقت" <${process.env.SMTP_FROM ?? 'noreply@airtransfer.com'}>`,
      to: email,
      subject: `Booking Confirmed — ${reference}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #059669, #16a34a); padding: 32px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Your airport transfer has been confirmed.</p>
          </div>

          <div style="background: white; padding: 32px 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            <p style="color: #334155; margin-top: 0;">Dear <strong>${customerName}</strong>,</p>
            <p style="color: #475569;">Great news! Your transfer booking is now confirmed. Here are your trip details:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="background: #f1f5f9;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; width: 40%;">Reference</td>
                <td style="padding: 12px 16px; color: #1e293b; font-family: monospace; font-size: 13px;">${reference}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Pickup</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${pickupName}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Destination</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${destinationName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0;">Date &amp; Time</td>
                <td style="padding: 12px 16px; color: #1e293b; border-top: 1px solid #e2e8f0;">${date} at ${time}</td>
              </tr>${driverRow}
            </table>

            ${statusBanner}

            <p style="color: #475569; font-size: 14px; margin-top: 24px;">
              Questions? Contact us or reply to this email.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    // Non-fatal: must not interrupt or roll back the booking status update.
    console.error('[smtp] Failed to send booking confirmed email:', error);
  }

  return null;
}

/**
 * Dispatches a polite "Booking Cancelled" notification email to the
 * guest customer, including the booking reference.
 *
 * Failures are non-fatal: SMTP errors are logged and `null` is returned
 * so the status update is never rolled back (FR-007).
 */
export async function sendBookingCancelledEmail(
  params: SendBookingCancelledEmailParams
): Promise<null> {
  const { email, customerName, reference } = params;

  try {
    await transporter.sendMail({
      from: `"دقه الوقت" <${process.env.SMTP_FROM ?? 'noreply@airtransfer.com'}>`,
      to: email,
      subject: `Booking Cancelled — ${reference}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #475569, #64748b); padding: 32px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Booking Cancelled</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Your airport transfer booking has been cancelled.</p>
          </div>

          <div style="background: white; padding: 32px 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            <p style="color: #334155; margin-top: 0;">Dear <strong>${customerName}</strong>,</p>
            <p style="color: #475569;">We're sorry to inform you that your airport transfer booking has been cancelled. If you believe this is an error or would like to rebook, please contact us as soon as possible.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tr style="background: #f1f5f9;">
                <td style="padding: 12px 16px; font-weight: 600; color: #475569; width: 40%;">Reference</td>
                <td style="padding: 12px 16px; color: #1e293b; font-family: monospace; font-size: 13px;">${reference}</td>
              </tr>
            </table>

            <p style="color: #475569; font-size: 14px; margin-top: 24px;">
              Questions? Contact us or reply to this email.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    // Non-fatal: must not interrupt or roll back the booking status update.
    console.error('[smtp] Failed to send booking cancelled email:', error);
  }

  return null;
}
