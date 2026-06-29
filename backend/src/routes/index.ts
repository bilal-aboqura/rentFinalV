import { Router } from 'express';
import locationRoutes from './location.js';
import bookingRoutes from './booking.js';
import contactRoutes from './contact.js';
import contentRoutes from './content.js';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';

const router = Router();

router.use('/locations', locationRoutes);
router.use('/bookings', bookingRoutes);
router.use('/contact', contactRoutes);
router.use('/content', contentRoutes);
router.use('/admin', authRoutes); // login + logout (public)
router.use('/admin', adminRoutes); // protected admin resources

export default router;
