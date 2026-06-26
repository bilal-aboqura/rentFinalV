import { vi, describe, it, expect, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { sendAdminNotificationEmail, sendBookingConfirmedEmail, sendBookingCancelledEmail } from '@/lib/mail/smtp';

vi.mock('nodemailer', () => {
  const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'test-id' });
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: sendMailMock,
      }),
    },
  };
});

describe('sendAdminNotificationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = 'admin@airporttransfers.com';
    process.env.SMTP_HOST = 'smtp.mailtrap.io';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_USER = 'test_smtp_user';
    process.env.SMTP_PASS = 'test_smtp_password';
  });

  it('should format and send the admin notification email with all details', async () => {
    const params = {
      reference: 'booking-uuid-123',
      pickupName: 'Location A',
      destinationName: 'Location B',
      date: '2026-06-27',
      time: '15:30',
      customerName: 'John Doe',
      adminEmail: 'admin@airporttransfers.com',
    };

    const res = await sendAdminNotificationEmail(params);
    expect(res).toBeDefined();

    const transporter = nodemailer.createTransport();
    expect(transporter.sendMail).toHaveBeenCalled();
    
    const sendMailCall = vi.mocked(transporter.sendMail).mock.calls[0][0];
    expect(sendMailCall.to).toBe('admin@airporttransfers.com');
    expect(sendMailCall.subject).toContain('New Booking Request');
    expect(sendMailCall.subject).toContain('booking-uuid-123');
    expect(sendMailCall.text).toContain('John Doe');
    expect(sendMailCall.text).toContain('Location A');
    expect(sendMailCall.text).toContain('Location B');
    expect(sendMailCall.html).toContain('/admin/bookings?ref=booking-uuid-123');
  });

  it('should resolve gracefully if email sending fails', async () => {
    const transporter = nodemailer.createTransport();
    vi.mocked(transporter.sendMail).mockRejectedValueOnce(new Error('SMTP error'));

    const params = {
      reference: 'booking-uuid-123',
      pickupName: 'Location A',
      destinationName: 'Location B',
      date: '2026-06-27',
      time: '15:30',
      customerName: 'John Doe',
      adminEmail: 'admin@airporttransfers.com',
    };

    const res = await sendAdminNotificationEmail(params);
    expect(res).toBeNull();
  });
});

describe('sendBookingConfirmedEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should format and send the booking confirmed email with driver details', async () => {
    const params = {
      email: 'customer@example.com',
      customerName: 'Alice Smith',
      reference: 'REF-CON-123',
      pickupName: 'Airport Terminal 1',
      destinationName: 'Sleek Downtown Hotel',
      date: '2026-06-28',
      time: '18:00',
      driverName: 'Bob Driver',
      driverPhone: '+123456789',
    };

    const res = await sendBookingConfirmedEmail(params);
    expect(res).toBeDefined();

    const transporter = nodemailer.createTransport();
    expect(transporter.sendMail).toHaveBeenCalled();

    const sendMailCall = vi.mocked(transporter.sendMail).mock.calls[0][0];
    expect(sendMailCall.to).toBe('customer@example.com');
    expect(sendMailCall.subject).toContain('Booking Confirmed');
    expect(sendMailCall.subject).toContain('REF-CON-123');
    expect(sendMailCall.text).toContain('Alice Smith');
    expect(sendMailCall.text).toContain('Bob Driver');
    expect(sendMailCall.text).toContain('+123456789');
    expect(sendMailCall.html).toContain('Airport Terminal 1');
    expect(sendMailCall.html).toContain('Sleek Downtown Hotel');
  });

  it('should format and send the booking confirmed email with a placeholder when driver details are missing', async () => {
    const params = {
      email: 'customer@example.com',
      customerName: 'Alice Smith',
      reference: 'REF-CON-123',
      pickupName: 'Airport Terminal 1',
      destinationName: 'Sleek Downtown Hotel',
      date: '2026-06-28',
      time: '18:00',
    };

    const res = await sendBookingConfirmedEmail(params);
    expect(res).toBeDefined();

    const transporter = nodemailer.createTransport();
    expect(transporter.sendMail).toHaveBeenCalled();

    const sendMailCall = vi.mocked(transporter.sendMail).mock.calls[0][0];
    expect(sendMailCall.to).toBe('customer@example.com');
    expect(sendMailCall.text).toContain('will be assigned shortly');
    expect(sendMailCall.html).toContain('will be assigned shortly');
  });

  it('should resolve gracefully if email sending fails', async () => {
    const transporter = nodemailer.createTransport();
    vi.mocked(transporter.sendMail).mockRejectedValueOnce(new Error('SMTP error'));

    const params = {
      email: 'customer@example.com',
      customerName: 'Alice Smith',
      reference: 'REF-CON-123',
      pickupName: 'Airport Terminal 1',
      destinationName: 'Sleek Downtown Hotel',
      date: '2026-06-28',
      time: '18:00',
    };

    const res = await sendBookingConfirmedEmail(params);
    expect(res).toBeNull();
  });
});

describe('sendBookingCancelledEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should format and send the booking cancelled email', async () => {
    const params = {
      email: 'customer@example.com',
      customerName: 'Alice Smith',
      reference: 'REF-CON-123',
    };

    const res = await sendBookingCancelledEmail(params);
    expect(res).toBeDefined();

    const transporter = nodemailer.createTransport();
    expect(transporter.sendMail).toHaveBeenCalled();

    const sendMailCall = vi.mocked(transporter.sendMail).mock.calls[0][0];
    expect(sendMailCall.to).toBe('customer@example.com');
    expect(sendMailCall.subject).toContain('Booking Cancelled');
    expect(sendMailCall.subject).toContain('REF-CON-123');
    expect(sendMailCall.text).toContain('Alice Smith');
    expect(sendMailCall.text).toContain('politely inform you');
  });

  it('should resolve gracefully if email sending fails', async () => {
    const transporter = nodemailer.createTransport();
    vi.mocked(transporter.sendMail).mockRejectedValueOnce(new Error('SMTP error'));

    const params = {
      email: 'customer@example.com',
      customerName: 'Alice Smith',
      reference: 'REF-CON-123',
    };

    const res = await sendBookingCancelledEmail(params);
    expect(res).toBeNull();
  });
});

