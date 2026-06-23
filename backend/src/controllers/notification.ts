import type { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { createError } from '../middleware/error';

function serializeNotification(n: Notification) {
  return {
    id: n.id,
    recipient_email: n.recipientEmail,
    message: n.message,
    type: n.type,
    read_status: n.readStatus,
    created_at: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
  };
}

function toInteger(value: unknown): number | null {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

export async function getNotifications(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await Notification.findAll({
      order: [['created_at', 'DESC']],
      limit: 20,
    });
    res.json(items.map(serializeNotification));
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await Notification.count({ where: { readStatus: false } });
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    if (id === null) throw createError(404, 'Notification not found.');
    const notification = await Notification.findByPk(id);
    if (!notification) throw createError(404, 'Notification not found.');
    notification.readStatus = true;
    await notification.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
