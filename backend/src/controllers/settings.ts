import type { Request, Response, NextFunction } from 'express';
import { UniqueConstraintError } from 'sequelize';
import { Driver } from '../models/Driver';
import { Location } from '../models/Location';
import { PricingRule } from '../models/PricingRule';
import { ENTITY_STATUS, LOCATION_TYPES, VEHICLE_CLASSES } from '../models/enums';
import { createError } from '../middleware/error';
import { serializeDriver, serializeLocation, serializePricingRule } from '../utils/serializers';

function toInteger(value: unknown): number | null {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function isEntityStatus(value: unknown) {
  return typeof value === 'string' && (ENTITY_STATUS as readonly string[]).includes(value);
}
function isLocationType(value: unknown) {
  return typeof value === 'string' && (LOCATION_TYPES as readonly string[]).includes(value);
}
function isVehicleClass(value: unknown) {
  return typeof value === 'string' && (VEHICLE_CLASSES as readonly string[]).includes(value);
}

function mapUniqueError(err: unknown, message: string): never {
  if (err instanceof UniqueConstraintError) throw createError(400, message);
  throw err;
}

/* ---------------- Drivers ---------------- */
export async function listDrivers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const drivers = await Driver.findAll({ order: [['name', 'ASC']] });
    res.json(drivers.map(serializeDriver));
  } catch (err) {
    next(err);
  }
}

export async function createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, phone, license_plate } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) throw createError(400, 'name is required.');
    if (typeof phone !== 'string' || !phone.trim()) throw createError(400, 'phone is required.');
    if (typeof license_plate !== 'string' || !license_plate.trim()) {
      throw createError(400, 'license_plate is required.');
    }
    const driver = await Driver.create({
      name: name.trim(),
      phone: phone.trim(),
      licensePlate: license_plate.trim(),
      status: 'active',
    }).catch((err) => {
      throw mapUniqueError(err, 'A driver with this license plate already exists.');
    });
    res.status(201).json(serializeDriver(driver));
  } catch (err) {
    next(err);
  }
}

export async function updateDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    const driver = await Driver.findByPk(id ?? undefined);
    if (!driver) throw createError(404, 'Driver not found.');

    const { name, phone, license_plate, status } = req.body ?? {};
    if (typeof name === 'string' && name.trim()) driver.name = name.trim();
    if (typeof phone === 'string' && phone.trim()) driver.phone = phone.trim();
    if (typeof license_plate === 'string' && license_plate.trim()) driver.licensePlate = license_plate.trim();
    if (isEntityStatus(status)) driver.status = status;

    await driver.save().catch((err) => {
      throw mapUniqueError(err, 'A driver with this license plate already exists.');
    });
    res.json(serializeDriver(driver));
  } catch (err) {
    next(err);
  }
}

export async function deleteDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    const driver = await Driver.findByPk(id ?? undefined);
    if (!driver) throw createError(404, 'Driver not found.');
    await driver.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/* ---------------- Locations ---------------- */
export async function listLocationsAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locations = await Location.findAll({ order: [['name', 'ASC']] });
    res.json(locations.map(serializeLocation));
  } catch (err) {
    next(err);
  }
}

export async function createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, type, status } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) throw createError(400, 'name is required.');
    if (!isLocationType(type)) throw createError(400, 'type must be city or airport.');
    const location = await Location.create({
      name: name.trim(),
      type,
      status: isEntityStatus(status) ? status : 'active',
    }).catch((err) => {
      throw mapUniqueError(err, 'A location with this name already exists.');
    });
    res.status(201).json(serializeLocation(location));
  } catch (err) {
    next(err);
  }
}

export async function updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    const location = await Location.findByPk(id ?? undefined);
    if (!location) throw createError(404, 'Location not found.');

    const { name, type, status } = req.body ?? {};
    if (typeof name === 'string' && name.trim()) location.name = name.trim();
    if (isLocationType(type)) location.type = type;
    if (isEntityStatus(status)) location.status = status;

    await location.save().catch((err) => {
      throw mapUniqueError(err, 'A location with this name already exists.');
    });
    res.json(serializeLocation(location));
  } catch (err) {
    next(err);
  }
}

export async function deleteLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    const location = await Location.findByPk(id ?? undefined);
    if (!location) throw createError(404, 'Location not found.');
    await location.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/* ---------------- Pricing rules ---------------- */
export async function listPricingRules(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rules = await PricingRule.findAll({
      include: [
        { association: 'pickupLocation', attributes: ['id', 'name'] },
        { association: 'destinationLocation', attributes: ['id', 'name'] },
      ],
      order: [['id', 'ASC']],
    });
    res.json(rules.map(serializePricingRule));
  } catch (err) {
    next(err);
  }
}

export async function createPricingRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pickupLocationId = toInteger(req.body?.pickup_location_id);
    const destinationLocationId = toInteger(req.body?.destination_location_id);
    const vehicleClass = req.body?.vehicle_class;
    const price = req.body?.price;

    if (pickupLocationId === null || destinationLocationId === null) {
      throw createError(400, 'pickup_location_id and destination_location_id are required.');
    }
    if (!isVehicleClass(vehicleClass)) throw createError(400, 'vehicle_class must be standard, executive, or van.');
    if (typeof price !== 'number' || price < 0) throw createError(400, 'price must be a non-negative number.');

    const rule = await PricingRule.create({
      pickupLocationId,
      destinationLocationId,
      vehicleClass,
      price,
    }).catch((err) => {
      throw mapUniqueError(err, 'A pricing rule for this route and vehicle class already exists.');
    });
    res.status(201).json(serializePricingRule(rule));
  } catch (err) {
    next(err);
  }
}

export async function updatePricingRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    const rule = await PricingRule.findByPk(id ?? undefined);
    if (!rule) throw createError(404, 'Pricing rule not found.');

    const { price } = req.body ?? {};
    if (typeof price === 'number') {
      if (price < 0) throw createError(400, 'price must be a non-negative number.');
      rule.price = price;
    }
    await rule.save();
    res.json(serializePricingRule(rule));
  } catch (err) {
    next(err);
  }
}

export async function deletePricingRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    const rule = await PricingRule.findByPk(id ?? undefined);
    if (!rule) throw createError(404, 'Pricing rule not found.');
    await rule.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
