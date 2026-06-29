/**
 * T002 [US1] — Unit tests for sendAdminNotificationEmail helper
 *
 * Written FIRST (TDD). Verifies that the admin "New Booking Request"
 * notification email is correctly formatted and dispatched to the
 * configured ADMIN_EMAIL, including a link to the admin panel.
 *
 * Spec: specs/008-new-request-alert/contracts/alert-contracts.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────
// Mock nodemailer (hoisted). The smtp module builds the transporter
// at import time, so we capture the sendMail spy via vi.hoisted.
// ─────────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  sendMail: vi.fn().mockResolvedValue({ messageId: 'admin-test-id' }),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mocks.sendMail })),
  },
}));

// ─────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────
const ADMIN_PARAMS = {
  reference: '203a95aa-208b-4946-b605-e408bf4a511c',
  pickupName: 'JFK Airport Terminal 4',
  destinationName: 'Grand Central Hotel',
  date: '2026-07-15',
  time: '14:30',
  customerName: 'Alice Johnson',
  adminEmail: 'admin@airporttransfers.com',
};

beforeEach(() => {
  mocks.sendMail.mockClear();
  process.env.SMTP_HOST = 'smtp.mailtrap.io';
  process.env.SMTP_PORT = '2525';
  process.env.SMTP_USER = 'test_user';
  process.env.SMTP_PASS = 'test_pass';
  process.env.SMTP_FROM = 'noreply@airporttransfers.com';
});

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────
describe('[US1] sendAdminNotificationEmail', () => {
  it('dispatches the email to the configured admin email address', async () => {
    const { sendAdminNotificationEmail } = await import('@/lib/mail/smtp');

    await sendAdminNotificationEmail(ADMIN_PARAMS);

    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@airporttransfers.com',
      })
    );
  });

  it('uses a subject that indicates a new booking request and includes the reference', async () => {
    const { sendAdminNotificationEmail } = await import('@/lib/mail/smtp');

    await sendAdminNotificationEmail(ADMIN_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.subject).toMatch(/new booking request/i);
    expect(call.subject).toContain(ADMIN_PARAMS.reference);
  });

  it('includes the pickup, destination, date, time, and customer name in the body', async () => {
    const { sendAdminNotificationEmail } = await import('@/lib/mail/smtp');

    await sendAdminNotificationEmail(ADMIN_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.html).toContain('JFK Airport Terminal 4');
    expect(call.html).toContain('Grand Central Hotel');
    expect(call.html).toContain('2026-07-15');
    expect(call.html).toContain('14:30');
    expect(call.html).toContain('Alice Johnson');
    expect(call.html).toContain(ADMIN_PARAMS.reference);
  });

  it('includes a hyperlink pointing to the admin bookings panel', async () => {
    const { sendAdminNotificationEmail } = await import('@/lib/mail/smtp');

    await sendAdminNotificationEmail(ADMIN_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.html).toMatch(/href=["']\/admin\/bookings/);
  });

  it('sends from the configured SMTP_FROM address', async () => {
    const { sendAdminNotificationEmail } = await import('@/lib/mail/smtp');

    await sendAdminNotificationEmail(ADMIN_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.from).toContain('noreply@airporttransfers.com');
  });

  it('does NOT throw when sendMail rejects — logs and resolves gracefully', async () => {
    const { sendAdminNotificationEmail } = await import('@/lib/mail/smtp');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.sendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

    // Must not throw — failures are non-fatal during checkout flow.
    await expect(sendAdminNotificationEmail(ADMIN_PARAMS)).resolves.not.toThrow();

    errorSpy.mockRestore();
  });
});
