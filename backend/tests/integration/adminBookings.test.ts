import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { Booking } from '../../src/models/Booking';
import { sequelize, resetDatabase, syncDatabase, seedFixtures, type SeedFixtures } from '../helpers/db';

let fixtures: SeedFixtures;
let cookie: string;

async function createBooking(overrides: Partial<Booking> = {}): Promise<Booking> {
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
    ...overrides,
  });
}

beforeAll(async () => {
  await syncDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  fixtures = await seedFixtures();
  const res = await request(app)
    .post('/api/admin/login')
    .send({ username: 'admin', password: 'SecurePassword123' });
  const setCookie = res.headers['set-cookie'];
  cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie).split(';')[0];
});

afterAll(async () => {
  await sequelize.close();
});

describe('US2 - Admin Booking Management', () => {
  it('blocks admin endpoints without auth (401)', async () => {
    await request(app).get('/api/admin/bookings').expect(401);
  });

  it('returns paginated bookings', async () => {
    await createBooking();
    await createBooking({ customerName: 'Jane Smith', customerEmail: 'jane@example.com' });

    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Cookie', cookie)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(res.body.count).toBe(2);
    expect(res.body.rows).toHaveLength(2);
    for (const row of res.body.rows) {
      expect(row).toHaveProperty('reference_id');
      expect(row).toHaveProperty('status');
    }
  });

  it('filters bookings by status', async () => {
    await createBooking({ status: 'pending' });
    await createBooking({ status: 'confirmed' });
    await createBooking({ status: 'pending' });

    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Cookie', cookie)
      .query({ status: 'confirmed' })
      .expect(200);

    expect(res.body.count).toBe(1);
    expect(res.body.rows[0].status).toBe('confirmed');
  });

  it('searches bookings by customer name and reference id', async () => {
    await createBooking({ customerName: 'Alice Wonder' });
    await createBooking({ customerName: 'Bob Builder' });

    const byName = await request(app)
      .get('/api/admin/bookings')
      .set('Cookie', cookie)
      .query({ search: 'Alice' })
      .expect(200);
    expect(byName.body.count).toBe(1);

    const booking = byName.body.rows[0];
    const byRef = await request(app)
      .get('/api/admin/bookings')
      .set('Cookie', cookie)
      .query({ search: booking.reference_id })
      .expect(200);
    expect(byRef.body.count).toBe(1);
  });

  it('transitions a booking from pending to confirmed', async () => {
    const booking = await createBooking({ status: 'pending' });
    const res = await request(app)
      .patch(`/api/admin/bookings/${booking.id}/status`)
      .set('Cookie', cookie)
      .send({ status: 'confirmed' })
      .expect(200);
    expect(res.body).toEqual({ id: booking.id, status: 'confirmed' });
  });

  it('rejects an invalid status transition (pending -> completed)', async () => {
    const booking = await createBooking({ status: 'pending' });
    await request(app)
      .patch(`/api/admin/bookings/${booking.id}/status`)
      .set('Cookie', cookie)
      .send({ status: 'completed' })
      .expect(400);
  });

  it('returns 404 for status update on a missing booking', async () => {
    await request(app)
      .patch('/api/admin/bookings/999999/status')
      .set('Cookie', cookie)
      .send({ status: 'confirmed' })
      .expect(404);
  });
});
