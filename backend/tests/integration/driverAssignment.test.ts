import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { Booking } from '../../src/models/Booking';
import { Driver } from '../../src/models/Driver';
import { sequelize, resetDatabase, syncDatabase, seedFixtures, type SeedFixtures } from '../helpers/db';

let fixtures: SeedFixtures;
let cookie: string;

async function makeBooking(tripDateTime: Date, status: 'pending' | 'confirmed' = 'pending'): Promise<Booking> {
  return Booking.create({
    referenceId: `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    pickupLocationId: fixtures.cityCenter.id,
    destinationLocationId: fixtures.airport.id,
    tripDateTime,
    vehicleClass: 'standard',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    customerPhone: '+1234567890',
    totalPrice: 45,
    status,
    driverId: null,
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

describe('US3 - Driver Assignment', () => {
  it('assigns an active driver to a booking', async () => {
    const booking = await makeBooking(new Date(Date.now() + 1000 * 60 * 60 * 48));
    const res = await request(app)
      .patch(`/api/admin/bookings/${booking.id}/driver`)
      .set('Cookie', cookie)
      .send({ driver_id: fixtures.driver.id })
      .expect(200);
    expect(res.body).toEqual({ id: booking.id, driver_id: fixtures.driver.id });
  });

  it('blocks assignment of an inactive driver', async () => {
    const inactive = await Driver.create({
      name: 'Off Duty',
      phone: '+12025550000',
      licensePlate: 'OD-001',
      status: 'inactive',
    });
    const booking = await makeBooking(new Date(Date.now() + 1000 * 60 * 60 * 48));
    await request(app)
      .patch(`/api/admin/bookings/${booking.id}/driver`)
      .set('Cookie', cookie)
      .send({ driver_id: inactive.id })
      .expect(400);
  });

  it('blocks assignment when the driver has an overlapping booking within 3 hours', async () => {
    const base = new Date(Date.now() + 1000 * 60 * 60 * 48);
    const first = await makeBooking(base, 'confirmed');
    await request(app)
      .patch(`/api/admin/bookings/${first.id}/driver`)
      .set('Cookie', cookie)
      .send({ driver_id: fixtures.driver.id })
      .expect(200);

    const overlapping = await makeBooking(new Date(base.getTime() + 2 * 60 * 60 * 1000));
    const res = await request(app)
      .patch(`/api/admin/bookings/${overlapping.id}/driver`)
      .set('Cookie', cookie)
      .send({ driver_id: fixtures.driver.id })
      .expect(400);
    expect(res.body.error).toMatch(/3 hours/i);
  });

  it('allows assignment when the driver is outside the 3-hour window', async () => {
    const base = new Date(Date.now() + 1000 * 60 * 60 * 48);
    const first = await makeBooking(base, 'confirmed');
    await request(app)
      .patch(`/api/admin/bookings/${first.id}/driver`)
      .set('Cookie', cookie)
      .send({ driver_id: fixtures.driver.id })
      .expect(200);

    const later = await makeBooking(new Date(base.getTime() + 5 * 60 * 60 * 1000));
    await request(app)
      .patch(`/api/admin/bookings/${later.id}/driver`)
      .set('Cookie', cookie)
      .send({ driver_id: fixtures.driver.id })
      .expect(200);
  });

  it('returns 404 when assigning a non-existent driver', async () => {
    const booking = await makeBooking(new Date(Date.now() + 1000 * 60 * 60 * 48));
    await request(app)
      .patch(`/api/admin/bookings/${booking.id}/driver`)
      .set('Cookie', cookie)
      .send({ driver_id: 999999 })
      .expect(404);
  });
});
