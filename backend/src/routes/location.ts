import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listLocations } from '../controllers/location.js';

const router = Router();

router.get('/', asyncHandler(listLocations));

export default router;
