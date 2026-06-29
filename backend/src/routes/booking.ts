import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createBooking, getPriceQuote } from '../controllers/booking.js';

const router = Router();

router.get('/price', asyncHandler(getPriceQuote));
router.post('/', asyncHandler(createBooking));

export default router;
