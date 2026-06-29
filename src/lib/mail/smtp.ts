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
      from: `"AirTransfer" <${process.env.SMTP_FROM ?? 'noreply@airtransfer.com'}>`,
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
