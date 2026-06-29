import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import type { BookingStatus } from '../types/index.js';

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export async function sendBookingStatusEmail(
  to: string,
  referenceId: string,
  status: BookingStatus | string,
): Promise<void> {
  const mailTransporter = getTransporter();
  await mailTransporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: `Booking ${referenceId} - ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Airport Transfer - Booking Update</h2>
        <p>Your booking <strong>${referenceId}</strong> status has been updated to
        <strong>${status}</strong>.</p>
        <p>Thank you for choosing Airport Transfers.</p>
      </div>
    `,
  });
}

export type { Transporter };
