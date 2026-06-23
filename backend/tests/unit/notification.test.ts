import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  sendMail,
  setTransporterForTesting,
  resetTransporter,
  type TestTransporter,
} from '../../src/services/email';
import {
  logAdminBookingNotification,
  notifyBookingStatusChange,
} from '../../src/services/notification';
import { Notification } from '../../src/models/Notification';
import { Booking } from '../../src/models/Booking';
import {
  sequelize,
  syncDatabase,
  resetDatabase,
  seedFixtures,
  type SeedFixtures,
} from '../helpers/db';

const sent: Parameters<TestTransporter['sendMail']>[0][] = [];
let fixtures: SeedFixtures;

const fakeTransporter: TestTransporter = {
  sendMail: async (opts) => {
    sent.push(opts);
    return { messageId: 'test-message-id' };
  },
};

beforeAll(async () => {
  setTransporterForTesting(fakeTransporter);
  await syncDatabase();
});

beforeEach(async () => {
  sent.length = 0;
  await resetDatabase();
  fixtures = await seedFixtures();
});

afterAll(async () => {
  resetTransporter();
  await sequelize.close();
});

describe('US4 - Notifications', () => {
  describe('email service', () => {
    it('sends mail through the configured transporter', async () => {
      const result = await sendMail({
        to: 'guest@example.com',
        subject: 'Hello',
        text: 'Welcome aboard',
      });
      expect(result.messageId).toBe('test-message-id');
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatchObject({ to: 'guest@example.com', subject: 'Hello', text: 'Welcome aboard' });
    });
  });

  describe('notification triggers', () => {
    async function makeBooking(): Promise<Booking> {
      return Booking.create({
        referenceId: `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        pickupLocationId: fixtures.cityCenter.id,
        destinationLocationId: fixtures.airport.id,
        tripDateTime: new Date(Date.now() + 1000 * 60 * 60 * 48),
        vehicleClass: 'standard',
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        customerPhone: '+1234567890',
        totalPrice: 45,
        status: 'pending',
        driverId: null,
      });
    }

    it('logs an admin notification when a booking is created', async () => {
      const booking = await makeBooking();
      await logAdminBookingNotification(booking);

      const record = await Notification.findOne({ where: { type: 'admin_new_booking' } });
      expect(record).not.toBeNull();
      expect(record?.message).toContain(booking.referenceId);
    });

    it('writes a customer notification and dispatches an email on status change', async () => {
      const booking = await makeBooking();
      sent.length = 0;
      await notifyBookingStatusChange(booking, 'confirmed');

      const record = await Notification.findOne({ where: { type: 'customer_status_change' } });
      expect(record).not.toBeNull();
      expect(record?.recipientEmail).toBe(booking.customerEmail);

      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatchObject({ to: booking.customerEmail, subject: expect.stringContaining('booking') });
    });
  });
});
