import type { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Booking } from '../models/Booking';
import { Driver } from '../models/Driver';
import { BOOKING_STATUSES, type BookingStatus } from '../models/enums';
import { createError } from '../middleware/error';
import { logger } from '../middleware/logger';
import { getPagination, serializeBookingListItem } from '../utils/serializers';
import { notifyBookingStatusChange } from '../services/notification';

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const DRIVER_OVERLAP_WINDOW_MS = 3 * 60 * 60 * 1000;

function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === 'string' && (BOOKING_STATUSES as readonly string[]).includes(value);
}

export async function getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit, offset } = getPagination(req);
    const where: Record<string, unknown> = {};

    const status = req.query.status;
    if (typeof status === 'string' && status.length > 0) {
      if (!isBookingStatus(status)) throw createError(400, 'Invalid status filter.');
      where.status = status;
    }

    const search = req.query.search;
    if (typeof search === 'string' && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      where[Op.or as unknown as string] = [
        { customer_name: { [Op.iLike]: term } },
        { customer_email: { [Op.iLike]: term } },
        { reference_id: { [Op.iLike]: term } },
      ];
    }

    const result = await Booking.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{ association: 'driver', attributes: ['id', 'name'] }],
      distinct: true,
    });

    res.json({
      count: result.count,
      rows: result.rows.map((booking) => serializeBookingListItem(booking)),
    });
  } catch (err) {
    next(err);
  }
}

function toInteger(value: unknown): number | null {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

export async function updateBookingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    if (id === null) throw createError(404, 'Booking not found.');

    const nextStatus = req.body?.status;
    if (!isBookingStatus(nextStatus)) {
      throw createError(400, 'status must be one of pending, confirmed, completed, or cancelled.');
    }

    const booking = await Booking.findByPk(id);
    if (!booking) throw createError(404, 'Booking not found.');

    const allowed = VALID_TRANSITIONS[booking.status];
    if (!allowed.includes(nextStatus)) {
      throw createError(400, `A booking in status "${booking.status}" cannot transition to "${nextStatus}".`);
    }

    booking.status = nextStatus;
    await booking.save();

    try {
      await notifyBookingStatusChange(booking, nextStatus);
    } catch (err) {
      logger.error(`Notification dispatch failed for booking ${booking.id}:`, err);
    }

    res.json({ id: booking.id, status: booking.status });
  } catch (err) {
    next(err);
  }
}

export async function assignDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    if (id === null) throw createError(404, 'Booking not found.');

    const driverId = toInteger(req.body?.driver_id);
    if (driverId === null) throw createError(400, 'driver_id is required.');

    const booking = await Booking.findByPk(id);
    if (!booking) throw createError(404, 'Booking not found.');

    const driver = await Driver.findByPk(driverId);
    if (!driver) throw createError(404, 'Driver not found.');
    if (driver.status !== 'active') {
      throw createError(400, 'Driver is not active and cannot be assigned.');
    }

    const windowStart = new Date(booking.tripDateTime.getTime() - DRIVER_OVERLAP_WINDOW_MS);
    const windowEnd = new Date(booking.tripDateTime.getTime() + DRIVER_OVERLAP_WINDOW_MS);
    const conflict = await Booking.findOne({
      where: {
        driverId: driver.id,
        id: { [Op.ne]: booking.id },
        tripDateTime: { [Op.between]: [windowStart, windowEnd] },
      },
    });
    if (conflict) {
      throw createError(400, 'Driver is already assigned to another booking within 3 hours of this trip.');
    }

    booking.driverId = driver.id;
    await booking.save();

    res.json({ id: booking.id, driver_id: booking.driverId });
  } catch (err) {
    next(err);
  }
}

export async function getBookingDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    if (id === null) throw createError(404, 'Booking not found.');

    const booking = await Booking.findByPk(id, {
      include: [
        { association: 'pickupLocation', attributes: ['id', 'name'] },
        { association: 'destinationLocation', attributes: ['id', 'name'] },
        { association: 'driver', attributes: ['id', 'name', 'license_plate'] },
      ],
    });
    if (!booking) throw createError(404, 'Booking not found.');

    res.json(serializeBookingListItem(booking));
  } catch (err) {
    next(err);
  }
}
