import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { me } from '../controllers/auth.js';
import {
  listBookings,
  updateBookingStatus,
  assignDriver,
} from '../controllers/adminBooking.js';
import {
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from '../controllers/settings.js';
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.js';
import {
  listContent,
  createContent,
  updateContent,
  deleteContent,
} from '../controllers/content.js';

const router = Router();

// All routes here are protected by JWT cookie auth.
router.use(authenticate);

router.get('/session', asyncHandler(me));

// Bookings management
router.get('/bookings', asyncHandler(listBookings));
router.patch('/bookings/:id/status', asyncHandler(updateBookingStatus));
router.patch('/bookings/:id/driver', asyncHandler(assignDriver));

// Drivers CRUD
router.get('/drivers', asyncHandler(listDrivers));
router.post('/drivers', asyncHandler(createDriver));
router.patch('/drivers/:id', asyncHandler(updateDriver));
router.delete('/drivers/:id', asyncHandler(deleteDriver));

// Locations CRUD
router.get('/locations', asyncHandler(listLocations));
router.post('/locations', asyncHandler(createLocation));
router.patch('/locations/:id', asyncHandler(updateLocation));
router.delete('/locations/:id', asyncHandler(deleteLocation));

// Pricing rules CRUD
router.get('/pricing-rules', asyncHandler(listPricingRules));
router.post('/pricing-rules', asyncHandler(createPricingRule));
router.patch('/pricing-rules/:id', asyncHandler(updatePricingRule));
router.delete('/pricing-rules/:id', asyncHandler(deletePricingRule));

// Notifications
router.get('/notifications', asyncHandler(listNotifications));
router.patch('/notifications/:id/read', asyncHandler(markAsRead));
router.post('/notifications/read-all', asyncHandler(markAllAsRead));

// Content management
router.get('/content', asyncHandler(listContent));
router.post('/content', asyncHandler(createContent));
router.patch('/content/:key', asyncHandler(updateContent));
router.delete('/content/:id', asyncHandler(deleteContent));

export default router;
