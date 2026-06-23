import { Location } from './Location';
import { Driver } from './Driver';
import { User } from './User';
import { PricingRule } from './PricingRule';
import { Booking } from './Booking';
import { Content } from './Content';
import { Notification } from './Notification';
import { sequelize } from '../config/database';

Location.hasMany(PricingRule, { as: 'pickupPricing', foreignKey: 'pickupLocationId' });
Location.hasMany(PricingRule, { as: 'destinationPricing', foreignKey: 'destinationLocationId' });
PricingRule.belongsTo(Location, { as: 'pickupLocation', foreignKey: 'pickupLocationId' });
PricingRule.belongsTo(Location, { as: 'destinationLocation', foreignKey: 'destinationLocationId' });

Location.hasMany(Booking, { as: 'pickupBookings', foreignKey: 'pickupLocationId' });
Location.hasMany(Booking, { as: 'destinationBookings', foreignKey: 'destinationLocationId' });
Booking.belongsTo(Location, { as: 'pickupLocation', foreignKey: 'pickupLocationId' });
Booking.belongsTo(Location, { as: 'destinationLocation', foreignKey: 'destinationLocationId' });

Driver.hasMany(Booking, { as: 'bookings', foreignKey: 'driverId' });
Booking.belongsTo(Driver, { as: 'driver', foreignKey: 'driverId' });

export const db = {
  sequelize,
  Sequelize: sequelize.constructor,
  Location,
  Driver,
  User,
  PricingRule,
  Booking,
  Content,
  Notification,
};

export type {
  Location,
  Driver,
  User,
  PricingRule,
  Booking,
  Content,
  Notification,
};

export {
  LOCATION_TYPES,
  ENTITY_STATUS,
  VEHICLE_CLASSES,
  BOOKING_STATUSES,
  USER_ROLES,
  NOTIFICATION_TYPES,
} from './enums';

export type {
  LocationType,
  EntityStatus,
  VehicleClass,
  BookingStatus,
  UserRole,
  NotificationType,
} from './enums';

export default db;
