import { Router } from 'express';
import { getPriceQuote, createBooking } from '../controllers/booking';

const router = Router();

router.get('/price', getPriceQuote);
router.post('/', createBooking);

export default router;
