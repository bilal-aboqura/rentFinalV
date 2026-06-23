import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { sequelize, resetDatabase, syncDatabase, seedFixtures, type SeedFixtures } from '../helpers/db';

let fixtures: SeedFixtures;
let cookie: string;

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

describe('US3 - Settings CRUD', () => {
  describe('Drivers', () => {
    it('creates, lists, updates, and deletes a driver', async () => {
      const created = await request(app)
        .post('/api/admin/drivers')
        .set('Cookie', cookie)
        .send({ name: 'Sarah Connor', phone: '+1999999999', license_plate: 'SAR-888' })
        .expect(201);
      expect(created.body).toMatchObject({
        name: 'Sarah Connor',
        phone: '+1999999999',
        license_plate: 'SAR-888',
        status: 'active',
      });
      const driverId = created.body.id;

      const list = await request(app).get('/api/admin/drivers').set('Cookie', cookie).expect(200);
      expect(Array.isArray(list.body)).toBe(true);
      expect(list.body.some((d: { id: number }) => d.id === driverId)).toBe(true);

      const updated = await request(app)
        .patch(`/api/admin/drivers/${driverId}`)
        .set('Cookie', cookie)
        .send({ status: 'inactive' })
        .expect(200);
      expect(updated.body.status).toBe('inactive');

      await request(app).delete(`/api/admin/drivers/${driverId}`).set('Cookie', cookie).expect(200);
      await request(app).get('/api/admin/drivers').set('Cookie', cookie).expect((res) => {
        expect(res.body.some((d: { id: number }) => d.id === driverId)).toBe(false);
      });
    });

    it('rejects duplicate license plates', async () => {
      await request(app)
        .post('/api/admin/drivers')
        .set('Cookie', cookie)
        .send({ name: 'James Carter', phone: '+1', license_plate: 'JC-100' })
        .expect(400);
    });
  });

  describe('Locations', () => {
    it('creates, lists, updates, and deletes a location', async () => {
      const created = await request(app)
        .post('/api/admin/locations')
        .set('Cookie', cookie)
        .send({ name: 'West Station', type: 'city' })
        .expect(201);
      expect(created.body).toMatchObject({ name: 'West Station', type: 'city', status: 'active' });
      const locationId = created.body.id;

      const list = await request(app).get('/api/admin/locations').set('Cookie', cookie).expect(200);
      expect(list.body.some((l: { id: number }) => l.id === locationId)).toBe(true);

      const updated = await request(app)
        .patch(`/api/admin/locations/${locationId}`)
        .set('Cookie', cookie)
        .send({ status: 'inactive' })
        .expect(200);
      expect(updated.body.status).toBe('inactive');

      await request(app).delete(`/api/admin/locations/${locationId}`).set('Cookie', cookie).expect(200);
    });
  });

  describe('Pricing rules', () => {
    it('creates, lists, updates, and deletes a pricing rule', async () => {
      const created = await request(app)
        .post('/api/admin/pricing-rules')
        .set('Cookie', cookie)
        .send({
          pickup_location_id: fixtures.cityCenter.id,
          destination_location_id: fixtures.airport.id,
          vehicle_class: 'van',
          price: 130,
        })
        .expect(201);
      expect(created.body).toMatchObject({ vehicle_class: 'van', price: 130 });
      const ruleId = created.body.id;

      const list = await request(app).get('/api/admin/pricing-rules').set('Cookie', cookie).expect(200);
      expect(list.body.some((r: { id: number }) => r.id === ruleId)).toBe(true);

      const updated = await request(app)
        .patch(`/api/admin/pricing-rules/${ruleId}`)
        .set('Cookie', cookie)
        .send({ price: 135 })
        .expect(200);
      expect(Number(updated.body.price)).toBe(135);

      await request(app).delete(`/api/admin/pricing-rules/${ruleId}`).set('Cookie', cookie).expect(200);
    });

    it('rejects a negative price', async () => {
      await request(app)
        .post('/api/admin/pricing-rules')
        .set('Cookie', cookie)
        .send({
          pickup_location_id: fixtures.cityCenter.id,
          destination_location_id: fixtures.airport.id,
          vehicle_class: 'van',
          price: -5,
        })
        .expect(400);
    });
  });
});
