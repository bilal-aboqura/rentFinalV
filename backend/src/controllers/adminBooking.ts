import type { Request, Response } from 'express';
import { Op, type WhereOptions } from 'sequelize';
import { z } from 'zod';
import { Booking, Driver } from '../models/index.js';
import type { BookingStatus } from '../types/index.js';
import { notifyCustomerStatusChange } from '../services/notification.js';
import { HttpError } from '../middleware/error.js';
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z
    .enum(['pending', 'confirmed', 'completed', 'cancelled'])
    .optional(),
  search: z.string().trim().optional(),
});

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
});

export async function listBookings(req: Request, res: Response): Promise<void> {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid query parameters.', parsed.error.flatten());
  }
  const { page, limit, status, search } = parsed.data;

  const where: Record<PropertyKey, unknown> = {};
  if (status) where.status = status;
  if (search) {
    const term = `%${search}%`;
    where[Op.and] = [
      {
        [Op.or]: [
          { customer_name: { [Op.like]: term } },
          { customer_email: { [Op.like]: term } },
          { reference_id: { [Op.like]: term } },
        ],
      },
    ];
  }

  const result = await Booking.findAndCountAll({
    where: where as unknown as WhereOptions,
    include: [{ model: Driver, as: 'Driver', required: false }],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  res.json({
    count: result.count,
    rows: result.rows,
    page,
    limit,
    totalPages: Math.ceil(result.count / limit) || 1,
  });
}

export async function updateBookingStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid status value.', parsed.error.flatten());
  }
  const nextStatus = parsed.data.status;

  const booking = await Booking.findByPk(req.params.id);
  if (!booking) {
    throw new HttpError(404, 'Booking not found.');
  }

  const current = booking.status as BookingStatus;
  const allowed = TRANSITIONS[current];
  if (!allowed.includes(nextStatus)) {
    throw new HttpError(
      400,
      `Cannot transition booking from "${current}" to "${nextStatus}".`,
    );
  }

  booking.status = nextStatus;
  await booking.save();

  // Fire-and-forget: log a customer notification and dispatch the SMTP email.
  notifyCustomerStatusChange(booking, nextStatus).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to notify customer of status change:', err);
  });

  res.json({ id: booking.id, status: booking.status });
}

const assignDriverSchema = z.object({
  driver_id: z.number().int().positive(),
});

const DRIVER_CONFLICT_WINDOW_MS = 3 * 60 * 60 * 1000;

export async function assignDriver(req: Request, res: Response): Promise<void> {
  const parsed = assignDriverSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid driver_id.', parsed.error.flatten());
  }
  const { driver_id } = parsed.data;

  const booking = await Booking.findByPk(req.params.id);
  if (!booking) {
    throw new HttpError(404, 'Booking not found.');
  }

  const driver = await Driver.findByPk(driver_id);
  if (!driver) {
    throw new HttpError(404, 'Driver not found.');
  }
  if (driver.status !== 'active') {
    throw new HttpError(400, 'Cannot assign an inactive driver.');
  }

  const tripTime = new Date(booking.trip_date_time);
  const where = {
    driver_id,
    id: { [Op.ne]: booking.id },
    status: { [Op.in]: ['pending', 'confirmed'] as BookingStatus[] },
    trip_date_time: {
      [Op.between]: [
        new Date(tripTime.getTime() - DRIVER_CONFLICT_WINDOW_MS),
        new Date(tripTime.getTime() + DRIVER_CONFLICT_WINDOW_MS),
      ],
    },
  };

  const conflicts = await Booking.findAll({
    where: where as unknown as WhereOptions,
  });

  if (conflicts.length > 0) {
    throw new HttpError(
      400,
      'Driver is already assigned to another booking within 3 hours of this trip.',
    );
  }

  booking.driver_id = driver_id;
  await booking.save();

  res.json({ id: booking.id, driver_id: booking.driver_id });
}
