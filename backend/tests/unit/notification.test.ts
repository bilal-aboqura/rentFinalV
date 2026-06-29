import { describe, it, expect, beforeEach, vi } from 'vitest';

// Capture the nodemailer sendMail mock across the hoisted vi.mock factory.
const mocks = vi.hoisted(() => ({
  sendMail: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail: mocks.sendMail }),
  },
}));

vi.mock('../../src/models/index.js', () => ({
  Notification: { create: vi.fn() },
}));

const { Notification } = await import('../../src/models/index.js');
const { sendBookingStatusEmail } = await import('../../src/services/email.js');
const {
  notifyAdminNewBooking,
  notifyCustomerStatusChange,
} = await import('../../src/services/notification.js');

describe('User Story 4 - Notifications (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendMail.mockResolvedValue({ messageId: 'mock-id' });
  });

  describe('SMTP email dispatch', () => {
    it('sends a transactional email through the SMTP transporter', async () => {
      await sendBookingStatusEmail('john@example.com', 'BK-ABC123', 'confirmed');

      expect(mocks.sendMail).toHaveBeenCalledTimes(1);
      const args = mocks.sendMail.mock.calls[0][0];
      expect(args.to).toBe('john@example.com');
      expect(args.subject).toMatch(/BK-ABC123/i);
      expect(args.subject).toMatch(/confirmed/i);
      expect(args.html).toBeDefined();
      expect(args.from).toBeDefined();
    });
  });

  describe('Notification database triggers', () => {
    it('writes an admin_new_booking notification on new booking', async () => {
      await notifyAdminNewBooking({
        id: 45,
        reference_id: 'BK-ABC123',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
      });

      expect(Notification.create).toHaveBeenCalledTimes(1);
      const payload = (Notification.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload).toMatchObject({ type: 'admin_new_booking' });
      expect(payload.message).toMatch(/BK-ABC123/);
    });

    it('writes a customer_status_change notification and dispatches an email', async () => {
      await notifyCustomerStatusChange(
        {
          id: 45,
          reference_id: 'BK-ABC123',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
        },
        'confirmed',
      );

      expect(Notification.create).toHaveBeenCalledTimes(1);
      const payload = (Notification.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload).toMatchObject({
        type: 'customer_status_change',
        recipient_email: 'john@example.com',
      });

      expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    });
  });
});
