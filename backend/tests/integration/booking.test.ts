import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { sequelize } from '../helpers/db';
import { Location } from '../../src/models/Location';
import { resetDatabase, syncDatabase, seedFixtures, type SeedFixtures } from '../helpers/db';

let fixtures: SeedFixtures;

beforeAll(async () => {
  await syncDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  fixtures = await seedFixtures();
});

afterAll(async () => {
  await sequelize.close();
});

describe('US1 - Customer Ride Booking', () => {
  describe('GET /api/locations', () => {
    it('returns only active locations', async () => {
      await Location.create({ name: 'Hidden Town', type: 'city', status: 'inactive' });
      const res = await request(app).get('/api/locations').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
      for (const loc of res.body) {
        expect(loc.status).toBe('active');
      }
      const names = res.body.map((l: { name: string }) => l.name);
      expect(names).toContain('City Center');
      expect(names).toContain('International Airport');
      expect(names).not.toContain('Hidden Town');
    });
  });

  describe('GET /api/bookings/price', () => {
    it('returns the price for a known route and vehicle class', async () => {
      const res = await request(app)
        .get('/api/bookings/price')
        .query({
          pickup_location_id: fixtures.cityCenter.id,
          destination_location_id: fixtures.airport.id,
          vehicle_class: 'standard',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        pickup_location_id: fixtures.cityCenter.id,
        destination_location_id: fixtures.airport.id,
        vehicle_class: 'standard',
        price: 45.0,
      });
    });

    it('returns executive pricing for the same route', async () => {
      const res = await request(app)
        .get('/api/bookings/price')
        .query({
          pickup_location_id: fixtures.cityCenter.id,
          destination_location_id: fixtures.airport.id,
          vehicle_class: 'executive',
        })
        .expect(200);

      expect(res.body.price).toBe(75.0);
    });

    it('returns 404 when no pricing rule exists', async () => {
      const res = await request(app)
        .get('/api/bookings/price')
        .query({
          pickup_location_id: fixtures.airport.id,
          destination_location_id: fixtures.downtown.id,
          vehicle_class: 'van',
        })
        .expect(404);

      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 for an invalid vehicle class', async () => {
      await request(app)
        .get('/api/bookings/price')
        .query({
          pickup_location_id: fixtures.cityCenter.id,
          destination_location_id: fixtures.airport.id,
          vehicle_class: 'luxury',
        })
        .expect(400);
    });
  });

  describe('POST /api/bookings', () => {
    const validPayload = (fx: SeedFixtures) => ({
      pickup_location_id: fx.cityCenter.id,
      destination_location_id: fx.airport.id,
      trip_date_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      vehicle_class: 'standard',
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      customer_phone: '+1234567890',
    });

    it('creates a booking in pending state with a reference id', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send(validPayload(fixtures))
        .expect(201);

      expect(res.body).toMatchObject({
        status: 'pending',
        vehicle_class: 'standard',
        customer_name: 'John Doe',
        total_price: 45.0,
        driver_id: null,
      });
      expect(res.body.reference_id).toMatch(/^BK-/);
      expect(res.body.id).toBeTruthy();
    });

    it('rejects a booking with a past trip date', async () => {
      const payload = {
        ...validPayload(fixtures),
        trip_date_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      };
      const res = await request(app).post('/api/bookings').send(payload).expect(400);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects a booking when no pricing rule exists', async () => {
      const payload = {
        ...validPayload(fixtures),
        destination_location_id: fixtures.downtown.id,
        vehicle_class: 'van',
      };
      await request(app).post('/api/bookings').send(payload).expect(404);
    });

    it('rejects a booking with missing required fields', async () => {
      const { customer_name, ...incomplete } = validPayload(fixtures);
      void customer_name;
      await request(app).post('/api/bookings').send(incomplete).expect(400);
    });
  });
});
