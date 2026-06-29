import type { Request, Response } from 'express';
import { z } from 'zod';
import { Driver, Location, PricingRule } from '../models/index.js';
import { HttpError } from '../middleware/error.js';

// ---------- Drivers ----------
const createDriverSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(5).max(40),
  license_plate: z.string().min(1).max(20),
  status: z.enum(['active', 'inactive']).optional(),
});
const updateDriverSchema = createDriverSchema.partial();

export async function listDrivers(_req: Request, res: Response): Promise<void> {
  const drivers = await Driver.findAll({ order: [['name', 'ASC']] });
  res.json(drivers);
}

export async function createDriver(req: Request, res: Response): Promise<void> {
  const parsed = createDriverSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid driver payload.', parsed.error.flatten());
  }
  const driver = await Driver.create(parsed.data);
  res.status(201).json(driver);
}

export async function updateDriver(req: Request, res: Response): Promise<void> {
  const parsed = updateDriverSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid driver payload.', parsed.error.flatten());
  }
  const driver = await Driver.findByPk(req.params.id);
  if (!driver) throw new HttpError(404, 'Driver not found.');
  Object.assign(driver, parsed.data);
  await driver.save();
  res.json(driver);
}

export async function deleteDriver(req: Request, res: Response): Promise<void> {
  const driver = await Driver.findByPk(req.params.id);
  if (!driver) throw new HttpError(404, 'Driver not found.');
  await driver.destroy();
  res.json({ success: true });
}

// ---------- Locations ----------
const createLocationSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(['city', 'airport']),
  status: z.enum(['active', 'inactive']).optional(),
});
const updateLocationSchema = createLocationSchema.partial();

export async function listLocations(_req: Request, res: Response): Promise<void> {
  const locations = await Location.findAll({ order: [['name', 'ASC']] });
  res.json(locations);
}

export async function createLocation(req: Request, res: Response): Promise<void> {
  const parsed = createLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid location payload.', parsed.error.flatten());
  }
  const location = await Location.create(parsed.data);
  res.status(201).json(location);
}

export async function updateLocation(req: Request, res: Response): Promise<void> {
  const parsed = updateLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid location payload.', parsed.error.flatten());
  }
  const location = await Location.findByPk(req.params.id);
  if (!location) throw new HttpError(404, 'Location not found.');
  Object.assign(location, parsed.data);
  await location.save();
  res.json(location);
}

export async function deleteLocation(req: Request, res: Response): Promise<void> {
  const location = await Location.findByPk(req.params.id);
  if (!location) throw new HttpError(404, 'Location not found.');
  await location.destroy();
  res.json({ success: true });
}

// ---------- Pricing Rules ----------
const createPricingSchema = z.object({
  pickup_location_id: z.number().int().positive(),
  destination_location_id: z.number().int().positive(),
  vehicle_class: z.enum(['standard', 'executive', 'van']),
  price: z.number().min(0),
});
const updatePricingSchema = createPricingSchema.partial();

export async function listPricingRules(_req: Request, res: Response): Promise<void> {
  const rules = await PricingRule.findAll({
    include: [
      { all: true },
    ],
    order: [['pickup_location_id', 'ASC']],
  });
  res.json(rules);
}

export async function createPricingRule(req: Request, res: Response): Promise<void> {
  const parsed = createPricingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid pricing rule payload.', parsed.error.flatten());
  }
  const rule = await PricingRule.create(parsed.data);
  res.status(201).json(rule);
}

export async function updatePricingRule(req: Request, res: Response): Promise<void> {
  const parsed = updatePricingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid pricing rule payload.', parsed.error.flatten());
  }
  const rule = await PricingRule.findByPk(req.params.id);
  if (!rule) throw new HttpError(404, 'Pricing rule not found.');
  Object.assign(rule, parsed.data);
  await rule.save();
  res.json(rule);
}

export async function deletePricingRule(req: Request, res: Response): Promise<void> {
  const rule = await PricingRule.findByPk(req.params.id);
  if (!rule) throw new HttpError(404, 'Pricing rule not found.');
  await rule.destroy();
  res.json({ success: true });
}
