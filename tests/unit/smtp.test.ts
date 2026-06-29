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

// ─────────────────────────────────────────────────────────────
// Spec 009 / US1 — sendBookingConfirmedEmail (T004)
// Contract: specs/009-status-change-alert/contracts/smtp.md
// ─────────────────────────────────────────────────────────────

const CONFIRMED_PARAMS = {
  email: 'alice@example.com',
  customerName: 'Alice Johnson',
  reference: 'BK-2026-0001',
  pickupName: 'JFK Airport Terminal 4',
  destinationName: 'Grand Central Hotel',
  date: '2026-07-15',
  time: '14:30',
  driverName: 'Sam Smith',
  driverPhone: '+15551234567',
};

describe('[US1] sendBookingConfirmedEmail', () => {
  it('dispatches the email to the customer email address', async () => {
    const { sendBookingConfirmedEmail } = await import('@/lib/mail/smtp');

    await sendBookingConfirmedEmail(CONFIRMED_PARAMS);

    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'alice@example.com' })
    );
  });

  it('uses a subject that indicates a confirmation and includes the reference', async () => {
    const { sendBookingConfirmedEmail } = await import('@/lib/mail/smtp');

    await sendBookingConfirmedEmail(CONFIRMED_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.subject).toMatch(/confirm/i);
    expect(call.subject).toContain(CONFIRMED_PARAMS.reference);
  });

  it('includes the trip details (pickup, destination, date, time) and customer name in the body', async () => {
    const { sendBookingConfirmedEmail } = await import('@/lib/mail/smtp');

    await sendBookingConfirmedEmail(CONFIRMED_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.html).toContain('JFK Airport Terminal 4');
    expect(call.html).toContain('Grand Central Hotel');
    expect(call.html).toContain('2026-07-15');
    expect(call.html).toContain('14:30');
    expect(call.html).toContain('Alice Johnson');
  });

  it('includes the assigned driver name and phone number when provided', async () => {
    const { sendBookingConfirmedEmail } = await import('@/lib/mail/smtp');

    await sendBookingConfirmedEmail(CONFIRMED_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.html).toContain('Sam Smith');
    expect(call.html).toContain('+15551234567');
  });

  it('omits driver block and states a driver will be assigned soon when no driver is provided (FR-008)', async () => {
    const { sendBookingConfirmedEmail } = await import('@/lib/mail/smtp');

    await sendBookingConfirmedEmail({ ...CONFIRMED_PARAMS, driverName: undefined, driverPhone: undefined });

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.html).not.toContain('Sam Smith');
    expect(call.html).toMatch(/assign(ed)?|soon|later|to be/i);
  });

  it('sends from the configured SMTP_FROM address', async () => {
    const { sendBookingConfirmedEmail } = await import('@/lib/mail/smtp');

    await sendBookingConfirmedEmail(CONFIRMED_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.from).toContain('noreply@airporttransfers.com');
  });

  it('does NOT throw when sendMail rejects — failures are non-fatal', async () => {
    const { sendBookingConfirmedEmail } = await import('@/lib/mail/smtp');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.sendMail.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(sendBookingConfirmedEmail(CONFIRMED_PARAMS)).resolves.not.toThrow();

    errorSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────
// Spec 009 / US2 — sendBookingCancelledEmail (T010)
// Contract: specs/009-status-change-alert/contracts/smtp.md
// ─────────────────────────────────────────────────────────────

const CANCELLED_PARAMS = {
  email: 'alice@example.com',
  customerName: 'Alice Johnson',
  reference: 'BK-2026-0001',
};

describe('[US2] sendBookingCancelledEmail', () => {
  it('dispatches the email to the customer email address', async () => {
    const { sendBookingCancelledEmail } = await import('@/lib/mail/smtp');

    await sendBookingCancelledEmail(CANCELLED_PARAMS);

    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'alice@example.com' })
    );
  });

  it('uses a subject that indicates a cancellation and includes the reference', async () => {
    const { sendBookingCancelledEmail } = await import('@/lib/mail/smtp');

    await sendBookingCancelledEmail(CANCELLED_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.subject).toMatch(/cancel/i);
    expect(call.subject).toContain(CANCELLED_PARAMS.reference);
  });

  it('includes the customer name, the booking reference, and a polite cancellation message in the body', async () => {
    const { sendBookingCancelledEmail } = await import('@/lib/mail/smtp');

    await sendBookingCancelledEmail(CANCELLED_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.html).toContain('Alice Johnson');
    expect(call.html).toContain('BK-2026-0001');
    expect(call.html).toMatch(/cancel/i);
  });

  it('sends from the configured SMTP_FROM address', async () => {
    const { sendBookingCancelledEmail } = await import('@/lib/mail/smtp');

    await sendBookingCancelledEmail(CANCELLED_PARAMS);

    const call = mocks.sendMail.mock.calls[0][0] as Record<string, string>;
    expect(call.from).toContain('noreply@airporttransfers.com');
  });

  it('does NOT throw when sendMail rejects — failures are non-fatal', async () => {
    const { sendBookingCancelledEmail } = await import('@/lib/mail/smtp');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.sendMail.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(sendBookingCancelledEmail(CANCELLED_PARAMS)).resolves.not.toThrow();

    errorSpy.mockRestore();
  });
});
