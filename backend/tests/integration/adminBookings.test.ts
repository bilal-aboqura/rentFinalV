import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/models/index.js', () => {
  const Booking = {
    findAndCountAll: vi.fn(),
    findByPk: vi.fn(),
  };
  const Driver = {};
  return { Booking, Driver };
});

vi.mock('../../src/services/notification.js', () => ({
  notifyCustomerStatusChange: vi.fn().mockResolvedValue(undefined),
}));

const { Booking } = await import('../../src/models/index.js');
const { createApp } = await import('../../src/app.js');
const { signToken } = await import('../../src/controllers/auth.js');

const TOKEN = signToken({ id: 1, username: 'admin', role: 'admin' });

function bookingInstance(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 45,
    reference_id: 'BK-A3F9D1',
    status: 'pending',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    total_price: 45,
    trip_date_time: new Date('2026-07-01T14:30:00Z'),
    driver_id: null,
    Driver: null,
    save: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue([1]),
    ...overrides,
  };
  return base;
}

describe('User Story 2 - Admin Bookings (integration)', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe('GET /api/admin/bookings', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/admin/bookings');
      expect(res.status).toBe(401);
    });

    it('returns a paginated booking list when authenticated', async () => {
      (Booking.findAndCountAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        count: 1,
        rows: [bookingInstance()],
      });

      const res = await request(app)
        .get('/api/admin/bookings')
        .set('Cookie', [`token=${TOKEN}`]);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ count: 1 });
      expect(res.body.rows[0]).toMatchObject({
        reference_id: 'BK-A3F9D1',
        status: 'pending',
      });
    });

    it('applies the status filter', async () => {
      (Booking.findAndCountAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        count: 0,
        rows: [],
      });

      await request(app)
        .get('/api/admin/bookings?status=confirmed')
        .set('Cookie', [`token=${TOKEN}`]);

      const call = (Booking.findAndCountAll as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.status).toBe('confirmed');
    });

    it('applies the search term across name, email and reference', async () => {
      (Booking.findAndCountAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        count: 0,
        rows: [],
      });

      await request(app)
        .get('/api/admin/bookings?search=John')
        .set('Cookie', [`token=${TOKEN}`]);

      const call = (Booking.findAndCountAll as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where[Symbol.for('and')]).toBeDefined();
    });
  });

  describe('PATCH /api/admin/bookings/:id/status', () => {
    it('transitions a pending booking to confirmed', async () => {
      const instance = bookingInstance({ status: 'pending' });
      (Booking.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(instance);

      const res = await request(app)
        .patch('/api/admin/bookings/45/status')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ status: 'confirmed' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 45, status: 'confirmed' });
      expect(instance.save).toHaveBeenCalled();
    });

    it('rejects an invalid status transition', async () => {
      (Booking.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
        bookingInstance({ status: 'completed' }),
      );

      const res = await request(app)
        .patch('/api/admin/bookings/45/status')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ status: 'confirmed' });

      expect(res.status).toBe(400);
    });

    it('returns 404 for a missing booking', async () => {
      (Booking.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/admin/bookings/999/status')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ status: 'confirmed' });

      expect(res.status).toBe(404);
    });
  });
});
