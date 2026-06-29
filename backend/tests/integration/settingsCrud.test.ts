import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/models/index.js', () => {
  function modelWith(methods: string[]) {
    const m: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of methods) {
      m[method] = vi.fn();
    }
    return m;
  }
  const Driver = modelWith(['findAll', 'findByPk', 'create', 'update', 'destroy']);
  const Location = modelWith(['findAll', 'findByPk', 'create', 'update', 'destroy']);
  const PricingRule = modelWith(['findAll', 'findByPk', 'create', 'update', 'destroy']);
  return { Driver, Location, PricingRule };
});

const { Driver, Location, PricingRule } = await import('../../src/models/index.js');
const { createApp } = await import('../../src/app.js');
const { signToken } = await import('../../src/controllers/auth.js');

const TOKEN = signToken({ id: 1, username: 'admin', role: 'admin' });

function instance(data: Record<string, unknown>) {
  return {
    ...data,
    save: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
}

describe('User Story 3 - Settings CRUD (integration)', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe('Drivers', () => {
    it('creates a driver', async () => {
      (Driver.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        instance({ id: 4, name: 'Sarah Connor', phone: '+1999999999', license_plate: 'SAR-888', status: 'active' }),
      );

      const res = await request(app)
        .post('/api/admin/drivers')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ name: 'Sarah Connor', phone: '+1999999999', license_plate: 'SAR-888' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Sarah Connor', license_plate: 'SAR-888' });
    });

    it('lists drivers', async () => {
      (Driver.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
        instance({ id: 4, name: 'Sarah', status: 'active' }),
      ]);

      const res = await request(app)
        .get('/api/admin/drivers')
        .set('Cookie', [`token=${TOKEN}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('updates a driver', async () => {
      (Driver.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(
        instance({ id: 4, name: 'Sarah', status: 'active' }),
      );

      const res = await request(app)
        .patch('/api/admin/drivers/4')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ status: 'inactive' });

      expect(res.status).toBe(200);
    });

    it('deletes a driver', async () => {
      const drv = instance({ id: 4 });
      (Driver.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(drv);

      const res = await request(app)
        .delete('/api/admin/drivers/4')
        .set('Cookie', [`token=${TOKEN}`]);

      expect(res.status).toBe(200);
      expect(drv.destroy).toHaveBeenCalled();
    });

    it('returns 404 when updating a missing driver', async () => {
      (Driver.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/admin/drivers/99')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ name: 'X' });

      expect(res.status).toBe(404);
    });
  });

  describe('Locations', () => {
    it('creates a location', async () => {
      (Location.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        instance({ id: 5, name: 'New City', type: 'city', status: 'active' }),
      );

      const res = await request(app)
        .post('/api/admin/locations')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ name: 'New City', type: 'city' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'New City', type: 'city' });
    });

    it('lists locations', async () => {
      (Location.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
        instance({ id: 1, name: 'City Center', type: 'city', status: 'active' }),
      ]);

      const res = await request(app)
        .get('/api/admin/locations')
        .set('Cookie', [`token=${TOKEN}`]);

      expect(res.status).toBe(200);
      expect(res.body[0]).toMatchObject({ name: 'City Center' });
    });
  });

  describe('Pricing Rules', () => {
    it('creates a pricing rule', async () => {
      (PricingRule.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        instance({ id: 10, pickup_location_id: 1, destination_location_id: 2, vehicle_class: 'standard', price: 45 }),
      );

      const res = await request(app)
        .post('/api/admin/pricing-rules')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ pickup_location_id: 1, destination_location_id: 2, vehicle_class: 'standard', price: 45 });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ vehicle_class: 'standard', price: 45 });
    });

    it('lists pricing rules', async () => {
      (PricingRule.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
        instance({ id: 10, vehicle_class: 'standard', price: 45 }),
      ]);

      const res = await request(app)
        .get('/api/admin/pricing-rules')
        .set('Cookie', [`token=${TOKEN}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('deletes a pricing rule', async () => {
      const rule = instance({ id: 10 });
      (PricingRule.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(rule);

      const res = await request(app)
        .delete('/api/admin/pricing-rules/10')
        .set('Cookie', [`token=${TOKEN}`]);

      expect(res.status).toBe(200);
      expect(rule.destroy).toHaveBeenCalled();
    });
  });
});
