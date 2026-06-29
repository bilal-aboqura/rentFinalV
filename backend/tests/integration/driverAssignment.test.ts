import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/models/index.js', () => {
  const Booking = {
    findAndCountAll: vi.fn(),
    findByPk: vi.fn(),
    findAll: vi.fn(),
  };
  const Driver = {
    findByPk: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  };
  return { Booking, Driver };
});

const { Booking, Driver } = await import('../../src/models/index.js');
const { createApp } = await import('../../src/app.js');
const { signToken } = await import('../../src/controllers/auth.js');

const TOKEN = signToken({ id: 1, username: 'admin', role: 'admin' });

function bookingWith(driverId: number | null, tripDateTime: Date, status = 'confirmed') {
  return {
    id: 45,
    driver_id: driverId,
    trip_date_time: tripDateTime,
    status,
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe('User Story 3 - Driver Assignment (integration)', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  it('assigns an active driver with no schedule conflict', async () => {
    (Booking.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      bookingWith(null, new Date('2026-08-01T10:00:00Z')),
    );
    (Driver.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 4,
      name: 'Sarah',
      status: 'active',
    });
    (Booking.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await request(app)
      .patch('/api/admin/bookings/45/driver')
      .set('Cookie', [`token=${TOKEN}`])
      .send({ driver_id: 4 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 45, driver_id: 4 });
  });

  it('returns 404 when the driver does not exist', async () => {
    (Booking.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      bookingWith(null, new Date('2026-08-01T10:00:00Z')),
    );
    (Driver.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/admin/bookings/45/driver')
      .set('Cookie', [`token=${TOKEN}`])
      .send({ driver_id: 99 });

    expect(res.status).toBe(404);
  });

  it('rejects assigning an inactive driver', async () => {
    (Booking.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      bookingWith(null, new Date('2026-08-01T10:00:00Z')),
    );
    (Driver.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 4,
      status: 'inactive',
    });

    const res = await request(app)
      .patch('/api/admin/bookings/45/driver')
      .set('Cookie', [`token=${TOKEN}`])
      .send({ driver_id: 4 });

    expect(res.status).toBe(400);
  });

  it('blocks assignment when an overlapping booking exists within 3 hours', async () => {
    (Booking.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
      bookingWith(null, new Date('2026-08-01T10:00:00Z')),
    );
    (Driver.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 4,
      status: 'active',
    });
    (Booking.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 50, trip_date_time: new Date('2026-08-01T11:30:00Z') },
    ]);

    const res = await request(app)
      .patch('/api/admin/bookings/45/driver')
      .set('Cookie', [`token=${TOKEN}`])
      .send({ driver_id: 4 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/within 3 hours/i);
  });

  it('returns 404 when the booking does not exist', async () => {
    (Booking.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/admin/bookings/999/driver')
      .set('Cookie', [`token=${TOKEN}`])
      .send({ driver_id: 4 });

    expect(res.status).toBe(404);
  });
});
