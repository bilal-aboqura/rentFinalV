import type { Request, Response } from 'express';
import { Location } from '../models/index.js';

export async function listLocations(_req: Request, res: Response): Promise<void> {
  const locations = await Location.findAll({
    where: { status: 'active' },
    attributes: ['id', 'name', 'type', 'status'],
    order: [['name', 'ASC']],
  });
  res.json(locations);
}
