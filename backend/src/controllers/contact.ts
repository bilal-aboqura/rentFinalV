import type { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { createError } from '../middleware/error';

interface ContactBody {
  name?: unknown;
  email?: unknown;
  message?: unknown;
}

export async function submitContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, message } = req.body as ContactBody;

    if (typeof name !== 'string' || name.trim().length === 0) {
      throw createError(400, 'name is required.');
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError(400, 'A valid email is required.');
    }
    if (typeof message !== 'string' || message.trim().length === 0) {
      throw createError(400, 'message is required.');
    }

    await Notification.create({
      recipientEmail: email.trim(),
      message: `Contact message from ${name.trim()} <${email.trim()}>: ${message.trim()}`,
      type: 'admin_new_booking',
      readStatus: false,
    });

    res.json({ success: true, message: 'Your message was sent successfully.' });
  } catch (err) {
    next(err);
  }
}
