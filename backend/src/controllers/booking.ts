import type { Request, Response, NextFunction } from 'express';
import { PricingRule } from '../models/PricingRule';
import { Booking } from '../models/Booking';
import { VEHICLE_CLASSES, type VehicleClass } from '../models/enums';
import { createError } from '../middleware/error';
import { generateBookingReference } from '../utils/reference';
import { serializeBooking } from '../utils/serializers';
import { logAdminBookingNotification } from '../services/notification';

function isVehicleClass(value: unknown): value is VehicleClass {
  return typeof value === 'string' && (VEHICLE_CLASSES as readonly string[]).includes(value);
}

function toInteger(value: unknown): number | null {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

export async function getPriceQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pickupLocationId = toInteger(req.query.pickup_location_id);
    const destinationLocationId = toInteger(req.query.destination_location_id);
    const vehicleClass = req.query.vehicle_class;

    if (pickupLocationId === null || destinationLocationId === null) {
      throw createError(400, 'pickup_location_id and destination_location_id are required.');
    }
    if (!isVehicleClass(vehicleClass)) {
      throw createError(400, 'vehicle_class must be one of standard, executive, or van.');
    }

    const rule = await PricingRule.findOne({
      where: {
        pickupLocationId,
        destinationLocationId,
        vehicleClass,
      },
    });

    if (!rule) {
      throw createError(404, 'No pricing rule defined for the selected route and vehicle class.');
    }

    res.json({
      pickup_location_id: rule.pickupLocationId,
      destination_location_id: rule.destinationLocationId,
      vehicle_class: rule.vehicleClass,
      price: Number(rule.price),
    });
  } catch (err) {
    next(err);
  }
}

interface CreateBookingBody {
  pickup_location_id?: unknown;
  destination_location_id?: unknown;
  trip_date_time?: unknown;
  vehicle_class?: unknown;
  customer_name?: unknown;
  customer_email?: unknown;
  customer_phone?: unknown;
}

export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as CreateBookingBody;
    const pickupLocationId = toInteger(body.pickup_location_id);
    const destinationLocationId = toInteger(body.destination_location_id);
    const vehicleClass = body.vehicle_class;

    if (pickupLocationId === null || destinationLocationId === null) {
      throw createError(400, 'pickup_location_id and destination_location_id are required.');
    }
    if (!isVehicleClass(vehicleClass)) {
      throw createError(400, 'vehicle_class must be one of standard, executive, or van.');
    }
    if (typeof body.customer_name !== 'string' || body.customer_name.trim().length === 0) {
      throw createError(400, 'customer_name is required.');
    }
    if (typeof body.customer_email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer_email)) {
      throw createError(400, 'A valid customer_email is required.');
    }
    if (typeof body.customer_phone !== 'string' || body.customer_phone.trim().length === 0) {
      throw createError(400, 'customer_phone is required.');
    }
    if (typeof body.trip_date_time !== 'string') {
      throw createError(400, 'trip_date_time is required.');
    }

    const tripDateTime = new Date(body.trip_date_time);
    if (Number.isNaN(tripDateTime.getTime())) {
      throw createError(400, 'trip_date_time must be a valid ISO date.');
    }
    if (tripDateTime.getTime() <= Date.now()) {
      throw createError(400, 'trip_date_time must be in the future.');
    }

    const rule = await PricingRule.findOne({
      where: { pickupLocationId, destinationLocationId, vehicleClass },
    });
    if (!rule) {
      throw createError(404, 'No pricing rule defined for the selected route and vehicle class.');
    }

    let referenceId = generateBookingReference();
    let referenceExists = await Booking.findOne({ where: { referenceId } });
    let attempts = 0;
    while (referenceExists && attempts < 5) {
      referenceId = generateBookingReference();
      referenceExists = await Booking.findOne({ where: { referenceId } });
      attempts += 1;
    }

    const booking = await Booking.create({
      referenceId,
      pickupLocationId,
      destinationLocationId,
      tripDateTime,
      vehicleClass,
      customerName: body.customer_name.trim(),
      customerEmail: body.customer_email.trim(),
      customerPhone: body.customer_phone.trim(),
      totalPrice: Number(rule.price),
      status: 'pending',
      driverId: null,
    });

    await logAdminBookingNotification(booking);

    res.status(201).json(serializeBooking(booking));
  } catch (err) {
    next(err);
  }
}
