import type { Request, Response } from 'express';
import { Notification } from '../models/index.js';
import { HttpError } from '../middleware/error.js';

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const unreadOnly = req.query.unread === 'true';
  const where = unreadOnly ? { read_status: false } : {};

  const rows = await Notification.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: 50,
  });
  const unreadCount = await Notification.count({ where: { read_status: false } });

  res.json({ rows, unreadCount });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) {
    throw new HttpError(404, 'Notification not found.');
  }
  notification.read_status = true;
  await notification.save();
  res.json({ success: true });
}

export async function markAllAsRead(_req: Request, res: Response): Promise<void> {
  await Notification.update(
    { read_status: true },
    { where: { read_status: false } },
  );
  res.json({ success: true });
}
