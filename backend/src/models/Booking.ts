import { Model, Optional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { VEHICLE_CLASSES, BOOKING_STATUSES, VehicleClass, BookingStatus } from './enums';

export interface BookingAttributes {
  id: number;
  referenceId: string;
  pickupLocationId: number;
  destinationLocationId: number;
  tripDateTime: Date;
  vehicleClass: VehicleClass;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  status: BookingStatus;
  driverId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BookingCreationAttributes
  extends Optional<BookingAttributes, 'id' | 'referenceId' | 'status' | 'driverId' | 'totalPrice'> {}

export class Booking
  extends Model<BookingAttributes, BookingCreationAttributes>
  implements BookingAttributes
{
  declare id: number;
  declare referenceId: string;
  declare pickupLocationId: number;
  declare destinationLocationId: number;
  declare tripDateTime: Date;
  declare vehicleClass: VehicleClass;
  declare customerName: string;
  declare customerEmail: string;
  declare customerPhone: string;
  declare totalPrice: number;
  declare status: BookingStatus;
  declare driverId: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Booking.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    referenceId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'reference_id',
      validate: { notEmpty: true },
    },
    pickupLocationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'pickup_location_id',
    },
    destinationLocationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'destination_location_id',
    },
    tripDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'trip_date_time',
    },
    vehicleClass: {
      type: DataTypes.ENUM(...VEHICLE_CLASSES),
      allowNull: false,
      field: 'vehicle_class',
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_name',
      validate: { notEmpty: true },
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_email',
      validate: { isEmail: true, notEmpty: true },
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_phone',
      validate: { notEmpty: true },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_price',
    },
    status: {
      type: DataTypes.ENUM(...BOOKING_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'driver_id',
    },
  },
  {
    sequelize,
    tableName: 'bookings',
    modelName: 'Booking',
  },
);
