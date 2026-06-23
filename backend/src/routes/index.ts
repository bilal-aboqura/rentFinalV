import type { Application } from 'express';
import locationRoutes from './location';
import bookingRoutes from './booking';
import contactRoutes from './contact';
import contentRoutes from './content';
import adminRoutes from './admin';

export function registerRoutes(app: Application): void {
  app.use('/api/locations', locationRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/admin', adminRoutes);
}
