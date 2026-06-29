import type { Sequelize } from 'sequelize';
import type { Location } from './Location.js';
import type { Driver } from './Driver.js';
import type { User } from './User.js';
import type { PricingRule } from './PricingRule.js';
import type { Booking } from './Booking.js';
import type { Content } from './Content.js';
import type { Notification } from './Notification.js';

export interface Models {
  sequelize: Sequelize;
  Location: typeof Location;
  Driver: typeof Driver;
  User: typeof User;
  PricingRule: typeof PricingRule;
  Booking: typeof Booking;
  Content: typeof Content;
  Notification: typeof Notification;
  hashPassword: (password: string) => string;
  generateReferenceId: () => string;
}
