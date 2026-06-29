import nodemailer from 'nodemailer';

// ----------------------------------------------------------------
// SMTP Transporter (configured from environment variables)
// ----------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ----------------------------------------------------------------
// Email Templates
// ----------------------------------------------------------------
interface BookingConfirmedPayload {
  customerName: string;
  customerEmail: string;
  referenceId: string;
  pickupLocation: string;
  destinationLocation: string;
  tripDateTime: string;
  vehicleClass: string;
  totalPrice: number;
}

interface BookingStatusChangedPayload {
  customerName: string;
  customerEmail: string;
  referenceId: string;
  newStatus: string;
}

// ----------------------------------------------------------------
// Send booking confirmation email
// ----------------------------------------------------------------
export async function sendBookingConfirmationEmail(
  payload: BookingConfirmedPayload
): Promise<void> {
  const { customerName, customerEmail, referenceId, pickupLocation, destinationLocation, tripDateTime, vehicleClass, totalPrice } = payload;

  const formattedDate = new Date(tripDateTime).toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  await transporter.sendMail({
    from: `"Airport Transfers" <${process.env.SMTP_FROM}>`,
    to: customerEmail,
    subject: `Booking Confirmation — ${referenceId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Your Booking is Confirmed</h2>
        <p>Dear ${customerName},</p>
        <p>Your airport transfer has been confirmed. Here are your booking details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; font-weight: bold;">Reference:</td><td>${referenceId}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Pickup:</td><td>${pickupLocation}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Destination:</td><td>${destinationLocation}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Date &amp; Time:</td><td>${formattedDate}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Vehicle:</td><td style="text-transform: capitalize;">${vehicleClass}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Total:</td><td>$${totalPrice.toFixed(2)}</td></tr>
        </table>
        <p>We look forward to serving you. Please contact us if you have any questions.</p>
      </div>
    `,
  });
}

// ----------------------------------------------------------------
// Send booking status change email (cancellation, completion, etc.)
// ----------------------------------------------------------------
export async function sendBookingStatusEmail(
  payload: BookingStatusChangedPayload
): Promise<void> {
  const { customerName, customerEmail, referenceId, newStatus } = payload;

  const statusMessages: Record<string, { subject: string; body: string }> = {
    confirmed: {
      subject: `Booking Confirmed — ${referenceId}`,
      body: 'Your booking has been confirmed. A driver will be assigned shortly.',
    },
    cancelled: {
      subject: `Booking Cancelled — ${referenceId}`,
      body: 'Unfortunately, your booking has been cancelled. Please contact us for more information.',
    },
    completed: {
      subject: `Trip Completed — ${referenceId}`,
      body: 'Your airport transfer has been completed. Thank you for choosing us!',
    },
  };

  const template = statusMessages[newStatus] ?? {
    subject: `Booking Update — ${referenceId}`,
    body: `Your booking status has been updated to: ${newStatus}.`,
  };

  await transporter.sendMail({
    from: `"Airport Transfers" <${process.env.SMTP_FROM}>`,
    to: customerEmail,
    subject: template.subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Booking Update</h2>
        <p>Dear ${customerName},</p>
        <p>${template.body}</p>
        <p><strong>Reference:</strong> ${referenceId}</p>
        <p>If you have questions, please reply to this email or contact our support team.</p>
      </div>
    `,
  });
}

// ----------------------------------------------------------------
// Verify SMTP connection (useful for health checks)
// ----------------------------------------------------------------
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
