import { sequelize } from '../config/database.js';
import { Location } from './Location.js';
import { Driver } from './Driver.js';
import { User, hashPassword } from './User.js';
import { PricingRule } from './PricingRule.js';
import { Booking, generateReferenceId } from './Booking.js';
import { Content } from './Content.js';
import { Notification } from './Notification.js';

// Associations
Location.hasMany(Booking, { foreignKey: 'pickup_location_id', as: 'pickupBookings' });
Location.hasMany(Booking, {
  foreignKey: 'destination_location_id',
  as: 'destinationBookings',
});
Location.hasMany(PricingRule, { foreignKey: 'pickup_location_id', as: 'pickupPricing' });
Location.hasMany(PricingRule, {
  foreignKey: 'destination_location_id',
  as: 'destinationPricing',
});

PricingRule.belongsTo(Location, { foreignKey: 'pickup_location_id', as: 'pickupLocation' });
PricingRule.belongsTo(Location, {
  foreignKey: 'destination_location_id',
  as: 'destinationLocation',
});

Booking.belongsTo(Location, { foreignKey: 'pickup_location_id', as: 'pickupLocation' });
Booking.belongsTo(Location, {
  foreignKey: 'destination_location_id',
  as: 'destinationLocation',
});
Booking.belongsTo(Driver, { foreignKey: 'driver_id', as: 'Driver' });
Driver.hasMany(Booking, { foreignKey: 'driver_id', as: 'bookings' });

export {
  sequelize,
  Location,
  Driver,
  User,
  PricingRule,
  Booking,
  Content,
  Notification,
  hashPassword,
  generateReferenceId,
};

export default {
  sequelize,
  Location,
  Driver,
  User,
  PricingRule,
  Booking,
  Content,
  Notification,
};
