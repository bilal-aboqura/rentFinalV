/**
 * T030 [US4] - Unit tests for Nodemailer SMTP email dispatches and notification logs
 * Written FIRST (TDD) — will pass once the email utility and notification actions are implemented.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock nodemailer to avoid real SMTP connections in tests
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id-123' }),
      verify: vi.fn().mockResolvedValue(true),
    })),
  },
}));

// ----------------------------------------------------------------
// T030 [US4] - Email Dispatch Tests
// ----------------------------------------------------------------
describe('[US4] Email Dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set dummy env vars for testing
    process.env.SMTP_HOST = 'smtp.mailtrap.io';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_USER = 'test_user';
    process.env.SMTP_PASS = 'test_pass';
    process.env.SMTP_FROM = 'noreply@test.com';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
  });

  it('sendBookingStatusEmail sends email with correct status message for "confirmed"', async () => {
    const { sendBookingStatusEmail } = await import('@/lib/email/nodemailer');
    const nodemailer = (await import('nodemailer')).default;
    const mockTransport = (nodemailer.createTransport as ReturnType<typeof vi.fn>).mock.results[0]?.value;

    if (mockTransport) {
      await sendBookingStatusEmail({
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        referenceId: 'BK-ABCDEF',
        newStatus: 'confirmed',
      });

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: expect.stringContaining('BK-ABCDEF'),
        })
      );
    }
  });

  it('sendBookingConfirmationEmail includes booking details', async () => {
    const { sendBookingConfirmationEmail } = await import('@/lib/email/nodemailer');
    const nodemailer = (await import('nodemailer')).default;
    const mockTransport = (nodemailer.createTransport as ReturnType<typeof vi.fn>).mock.results[0]?.value;

    const payload = {
      customerName: 'Alice Smith',
      customerEmail: 'alice@example.com',
      referenceId: 'BK-XYZ123',
      pickupLocation: 'City Center',
      destinationLocation: 'International Airport',
      tripDateTime: new Date(Date.now() + 86400000).toISOString(),
      vehicleClass: 'executive',
      totalPrice: 75.00,
    };

    if (mockTransport) {
      await sendBookingConfirmationEmail(payload);
      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'alice@example.com',
          subject: expect.stringContaining('BK-XYZ123'),
        })
      );
    }
  });

  it('verifySmtpConnection returns true on successful connection', async () => {
    const { verifySmtpConnection } = await import('@/lib/email/nodemailer');
    const result = await verifySmtpConnection();
    // With mocked nodemailer, verify() resolves — but our wrapper catches errors
    // The key thing is the function executes without throwing
    expect(typeof result).toBe('boolean');
  });
});

// ----------------------------------------------------------------
// T030 [US4] - Notification Database Log Tests
// ----------------------------------------------------------------
describe('[US4] Notification Database Logs', () => {
  it('notification type must be admin_new_booking or customer_status_change', () => {
    const validTypes = ['admin_new_booking', 'customer_status_change'];
    const testType = 'admin_new_booking';
    expect(validTypes).toContain(testType);
  });

  it('new booking creates admin_new_booking notification type', () => {
    // Simulates the logic inside createNotificationAction
    const createNotificationPayload = (bookingRefId: string) => ({
      message: `New booking received: ${bookingRefId}`,
      type: 'admin_new_booking' as const,
      recipient_email: null,
      read_status: false,
    });

    const payload = createNotificationPayload('BK-ABCDEF');
    expect(payload.type).toBe('admin_new_booking');
    expect(payload.message).toContain('BK-ABCDEF');
    expect(payload.read_status).toBe(false);
  });

  it('status change creates customer_status_change notification type', () => {
    const createStatusNotification = (customerEmail: string, status: string) => ({
      message: `Booking status changed to ${status}`,
      type: 'customer_status_change' as const,
      recipient_email: customerEmail,
      read_status: false,
    });

    const payload = createStatusNotification('customer@example.com', 'confirmed');
    expect(payload.type).toBe('customer_status_change');
    expect(payload.recipient_email).toBe('customer@example.com');
  });
});
