import type { Request, Response, NextFunction } from 'express';
import { Location } from '../models/Location';
import { serializeLocation } from '../utils/serializers';

export async function getLocations(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locations = await Location.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'type', 'status'],
      order: [['name', 'ASC']],
    });
    res.json(locations.map(serializeLocation));
  } catch (err) {
    next(err);
  }
}
