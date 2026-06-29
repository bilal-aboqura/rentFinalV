import type { Request, Response } from 'express';
import { z } from 'zod';
import { Notification } from '../models/index.js';
import { HttpError } from '../middleware/error.js';

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

export async function submitContact(req: Request, res: Response): Promise<void> {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid contact payload.', parsed.error.flatten());
  }
  const { name, email, message } = parsed.data;

  await Notification.create({
    recipient_email: email,
    message: `Contact inquiry from ${name} <${email}>: ${message}`,
    type: 'admin_new_booking',
  });

  res.json({ success: true, message: 'Your message was sent successfully.' });
}
