import type { Request, Response } from 'express';
import { z } from 'zod';
import { Booking, PricingRule, generateReferenceId } from '../models/index.js';
import { notifyAdminNewBooking } from '../services/notification.js';
import { HttpError } from '../middleware/error.js';

const vehicleClassSchema = z.enum(['standard', 'executive', 'van']);

const priceQuerySchema = z.object({
  pickup_location_id: z.coerce.number().int().positive(),
  destination_location_id: z.coerce.number().int().positive(),
  vehicle_class: vehicleClassSchema,
});

const createBookingSchema = z.object({
  pickup_location_id: z.number().int().positive(),
  destination_location_id: z.number().int().positive(),
  trip_date_time: z.string().datetime(),
  vehicle_class: vehicleClassSchema,
  customer_name: z.string().min(1).max(120),
  customer_email: z.string().email(),
  customer_phone: z.string().min(5).max(40),
});

async function resolvePrice(
  pickup: number,
  destination: number,
  vehicleClass: string,
): Promise<{ rule: { price: string }; price: number }> {
  const rule = await PricingRule.findOne({
    where: {
      pickup_location_id: pickup,
      destination_location_id: destination,
      vehicle_class: vehicleClass,
    },
  });
  if (!rule) {
    throw new HttpError(
      404,
      'No pricing rule defined for the selected route and vehicle class.',
    );
  }
  return { rule: { price: String((rule as { price: unknown }).price) }, price: Number((rule as { price: unknown }).price) };
}

export async function getPriceQuote(req: Request, res: Response): Promise<void> {
  const parsed = priceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid query parameters.', parsed.error.flatten());
  }
  const { pickup_location_id, destination_location_id, vehicle_class } = parsed.data;

  if (pickup_location_id === destination_location_id) {
    throw new HttpError(400, 'Pickup and destination must be different.');
  }

  const { price } = await resolvePrice(
    pickup_location_id,
    destination_location_id,
    vehicle_class,
  );

  res.json({
    pickup_location_id,
    destination_location_id,
    vehicle_class,
    price,
  });
}

export async function createBooking(req: Request, res: Response): Promise<void> {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid booking payload.', parsed.error.flatten());
  }
  const data = parsed.data;

  if (data.pickup_location_id === data.destination_location_id) {
    throw new HttpError(400, 'Pickup and destination must be different.');
  }

  const tripDateTime = new Date(data.trip_date_time);
  if (Number.isNaN(tripDateTime.getTime()) || tripDateTime.getTime() <= Date.now()) {
    throw new HttpError(400, 'trip_date_time must be a valid future date.');
  }

  const { price } = await resolvePrice(
    data.pickup_location_id,
    data.destination_location_id,
    data.vehicle_class,
  );

  const booking = await Booking.create({
    reference_id: generateReferenceId(),
    pickup_location_id: data.pickup_location_id,
    destination_location_id: data.destination_location_id,
    trip_date_time: tripDateTime,
    vehicle_class: data.vehicle_class,
    customer_name: data.customer_name,
    customer_email: data.customer_email,
    customer_phone: data.customer_phone,
    total_price: price,
    status: 'pending',
    driver_id: null,
  });

  // Fire-and-forget: alert admins of the new booking without blocking the response.
  notifyAdminNewBooking(booking).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to notify admin of new booking:', err);
  });

  res.status(201).json(booking);
}
