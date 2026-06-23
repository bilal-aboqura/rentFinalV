import type { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { UniqueConstraintError } from 'sequelize';
import { Content } from '../models/Content';
import { createError } from '../middleware/error';

function toInteger(value: unknown): number | null {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function mapUniqueError(err: unknown, message: string): never {
  if (err instanceof UniqueConstraintError) throw createError(400, message);
  throw err;
}

/* ---------------- Public ---------------- */
export async function getPublicContent(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entries = await Content.findAll({ order: [['key', 'ASC']] });
    res.json(entries.map((c) => ({ key: c.key, value: c.value })));
  } catch (err) {
    next(err);
  }
}

export async function getFaq(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entries = await Content.findAll({
      where: { key: { [Op.like]: 'faq_%' } },
      order: [['key', 'ASC']],
    });
    res.json(entries.map((c) => ({ key: c.key, value: c.value })));
  } catch (err) {
    next(err);
  }
}

/* ---------------- Admin ---------------- */
function serializeContent(c: Content) {
  return { id: c.id, key: c.key, value: c.value, description: c.description };
}

export async function listContent(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entries = await Content.findAll({ order: [['key', 'ASC']] });
    res.json(entries.map(serializeContent));
  } catch (err) {
    next(err);
  }
}

export async function createContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { key, value, description } = req.body ?? {};
    if (typeof key !== 'string' || !key.trim()) throw createError(400, 'key is required.');
    if (typeof value !== 'string' || !value.trim()) throw createError(400, 'value is required.');

    const content = await Content.create({
      key: key.trim(),
      value,
      description: typeof description === 'string' ? description : null,
    }).catch((err) => {
      throw mapUniqueError(err, 'A content entry with this key already exists.');
    });
    res.status(201).json(serializeContent(content));
  } catch (err) {
    next(err);
  }
}

export async function updateContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    const content = await Content.findByPk(id ?? undefined);
    if (!content) throw createError(404, 'Content not found.');

    const { value, description, key } = req.body ?? {};
    if (typeof value === 'string' && value.trim()) content.value = value;
    if (typeof key === 'string' && key.trim()) content.key = key.trim();
    if (description !== undefined) content.description = typeof description === 'string' ? description : null;

    await content.save().catch((err) => {
      throw mapUniqueError(err, 'A content entry with this key already exists.');
    });
    res.json(serializeContent(content));
  } catch (err) {
    next(err);
  }
}

export async function deleteContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toInteger(req.params.id);
    const content = await Content.findByPk(id ?? undefined);
    if (!content) throw createError(404, 'Content not found.');
    await content.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
