import { Router } from 'express';
import authRouter from './auth';
import { requireAuth } from '../middleware/auth';
import { me } from '../controllers/auth';
import {
  getBookings,
  getBookingDetail,
  updateBookingStatus,
  assignDriver,
} from '../controllers/adminBooking';
import {
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  listLocationsAdmin,
  createLocation,
  updateLocation,
  deleteLocation,
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from '../controllers/settings';
import {
  getNotifications,
  getUnreadCount,
  markRead,
} from '../controllers/notification';
import {
  listContent,
  createContent,
  updateContent,
  deleteContent,
} from '../controllers/content';

const router = Router();

router.use('/', authRouter);

router.use(requireAuth);

router.get('/me', me);

router.get('/bookings', getBookings);
router.get('/bookings/:id', getBookingDetail);
router.patch('/bookings/:id/status', updateBookingStatus);
router.patch('/bookings/:id/driver', assignDriver);

router.get('/drivers', listDrivers);
router.post('/drivers', createDriver);
router.patch('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteDriver);

router.get('/locations', listLocationsAdmin);
router.post('/locations', createLocation);
router.patch('/locations/:id', updateLocation);
router.delete('/locations/:id', deleteLocation);

router.get('/pricing-rules', listPricingRules);
router.post('/pricing-rules', createPricingRule);
router.patch('/pricing-rules/:id', updatePricingRule);
router.delete('/pricing-rules/:id', deletePricingRule);

router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/:id/read', markRead);

router.get('/content', listContent);
router.post('/content', createContent);
router.patch('/content/:id', updateContent);
router.delete('/content/:id', deleteContent);

export default router;
