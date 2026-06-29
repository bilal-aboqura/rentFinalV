import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { Content } from '../models/index.js';
import { HttpError } from '../middleware/error.js';

// ---------- Public ----------
export async function getFaq(_req: Request, res: Response): Promise<void> {
  const items = await Content.findAll({
    where: { key: { [Op.like]: 'faq_%' } },
    order: [['key', 'ASC']],
  });
  res.json(items);
}

export async function getAllContent(_req: Request, res: Response): Promise<void> {
  const items = await Content.findAll({ order: [['key', 'ASC']] });
  res.json(items);
}

// ---------- Admin ----------
const createContentSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.string().min(1),
  description: z.string().max(255).optional(),
});

const updateContentSchema = z.object({
  value: z.string().min(1).optional(),
  description: z.string().max(255).optional(),
});

export async function listContent(_req: Request, res: Response): Promise<void> {
  const items = await Content.findAll({ order: [['key', 'ASC']] });
  res.json(items);
}

export async function createContent(req: Request, res: Response): Promise<void> {
  const parsed = createContentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid content payload.', parsed.error.flatten());
  }
  const item = await Content.create(parsed.data);
  res.status(201).json(item);
}

export async function updateContent(req: Request, res: Response): Promise<void> {
  const parsed = updateContentSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid content payload.', parsed.error.flatten());
  }
  const item = await Content.findOne({ where: { key: req.params.key } });
  if (!item) {
    throw new HttpError(404, 'Content entry not found.');
  }
  Object.assign(item, parsed.data);
  await item.save();
  res.json(item);
}

export async function deleteContent(req: Request, res: Response): Promise<void> {
  const item = await Content.findByPk(req.params.id);
  if (!item) {
    throw new HttpError(404, 'Content entry not found.');
  }
  await item.destroy();
  res.json({ success: true });
}
