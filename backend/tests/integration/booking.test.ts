import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// ---------------------------------------------------------------------------
// Mock the Sequelize model layer so integration tests run without a database.
// vi.mock is hoisted; the factory must be self-contained (no outer references).
// ---------------------------------------------------------------------------
vi.mock('../../src/models/index.js', () => {
  const Location = {
    findAll: vi.fn(),
  };
  const PricingRule = {
    findOne: vi.fn(),
  };
  const Booking = {
    create: vi.fn(),
  };
  const Notification = { create: vi.fn() };
  return {
    Location,
    PricingRule,
    Booking,
    Notification,
    generateReferenceId: vi.fn(() => 'BK-TEST1'),
  };
});

const { Location, PricingRule, Booking } = await import(
  '../../src/models/index.js'
);
const { createApp } = await import('../../src/app.js');

describe('User Story 1 - Customer Booking (integration)', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe('GET /api/locations', () => {
    it('returns only active locations', async () => {
      (Location.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 1, name: 'City Center', type: 'city', status: 'active' },
        { id: 2, name: 'International Airport', type: 'airport', status: 'active' },
      ]);

      const res = await request(app).get('/api/locations');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({ name: 'City Center', status: 'active' });
      expect(Location.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'active' } }),
      );
    });
  });

  describe('GET /api/bookings/price', () => {
    it('returns the price for a valid route and vehicle class', async () => {
      (PricingRule.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 10,
        pickup_location_id: 1,
        destination_location_id: 2,
        vehicle_class: 'executive',
        price: '75.00',
      });

      const res = await request(app).get(
        '/api/bookings/price?pickup_location_id=1&destination_location_id=2&vehicle_class=executive',
      );

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        pickup_location_id: 1,
        destination_location_id: 2,
        vehicle_class: 'executive',
        price: 75,
      });
    });

    it('returns 404 when no pricing rule exists', async () => {
      (PricingRule.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const res = await request(app).get(
        '/api/bookings/price?pickup_location_id=1&destination_location_id=2&vehicle_class=van',
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/no pricing rule/i);
    });

    it('returns 400 for an invalid vehicle class', async () => {
      const res = await request(app).get(
        '/api/bookings/price?pickup_location_id=1&destination_location_id=2&vehicle_class=bike',
      );
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/bookings', () => {
    const validPayload = {
      pickup_location_id: 1,
      destination_location_id: 2,
      trip_date_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      vehicle_class: 'standard',
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      customer_phone: '+1234567890',
    };

    it('creates a booking in pending status', async () => {
      (PricingRule.findOne as ReturnType<typeof vi.fn>).mockResolvedValue({
        price: '45.00',
      });
      (Booking.create as ReturnType<typeof vi.fn>).mockImplementation(
        async (data: unknown) => ({ id: 45, ...(data as object), status: 'pending' }),
      );

      const res = await request(app).post('/api/bookings').send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        reference_id: 'BK-TEST1',
        status: 'pending',
        driver_id: null,
        total_price: 45,
      });
      expect(Booking.create).toHaveBeenCalledTimes(1);
    });

    it('rejects a booking with a past trip date', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ ...validPayload, trip_date_time: '2020-01-01T00:00:00.000Z' });

      expect(res.status).toBe(400);
      expect(Booking.create).not.toHaveBeenCalled();
    });

    it('rejects a booking when no pricing rule exists', async () => {
      (PricingRule.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const res = await request(app).post('/api/bookings').send(validPayload);

      expect(res.status).toBe(404);
      expect(Booking.create).not.toHaveBeenCalled();
    });
  });
});
