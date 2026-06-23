import { Router } from 'express';
import { getLocations } from '../controllers/location';

const router = Router();

router.get('/', getLocations);

export default router;
