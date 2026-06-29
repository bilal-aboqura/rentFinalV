import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import type { VehicleClass, BookingStatus } from '../types/index.js';

interface BookingAttributes {
  id: number;
  reference_id: string;
  pickup_location_id: number;
  destination_location_id: number;
  trip_date_time: Date;
  vehicle_class: VehicleClass;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_price: number;
  status: BookingStatus;
  driver_id: number | null;
}

interface BookingCreationAttributes {
  reference_id?: string;
  pickup_location_id: number;
  destination_location_id: number;
  trip_date_time: Date;
  vehicle_class: VehicleClass;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_price: number;
  status?: BookingStatus;
  driver_id?: number | null;
}

class Booking
  extends Model<BookingAttributes, BookingCreationAttributes>
  implements BookingAttributes
{
  declare id: number;
  declare reference_id: string;
  declare pickup_location_id: number;
  declare destination_location_id: number;
  declare trip_date_time: Date;
  declare vehicle_class: VehicleClass;
  declare customer_name: string;
  declare customer_email: string;
  declare customer_phone: string;
  declare total_price: number;
  declare status: BookingStatus;
  declare driver_id: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Booking.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    reference_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    pickup_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'locations', key: 'id' },
      onDelete: 'RESTRICT',
    },
    destination_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'locations', key: 'id' },
      onDelete: 'RESTRICT',
    },
    trip_date_time: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isFuture(value: Date) {
          if (new Date(value).getTime() <= Date.now()) {
            throw new Error('trip_date_time must be in the future.');
          }
        },
      },
    },
    vehicle_class: {
      type: DataTypes.ENUM('standard', 'executive', 'van'),
      allowNull: false,
    },
    customer_name: { type: DataTypes.STRING, allowNull: false },
    customer_email: { type: DataTypes.STRING, allowNull: false },
    customer_phone: { type: DataTypes.STRING, allowNull: false },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'drivers', key: 'id' },
      onDelete: 'SET NULL',
    },
  },
  {
    sequelize,
    tableName: 'bookings',
    modelName: 'Booking',
    timestamps: true,
  },
);

export function generateReferenceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BK-${code}`;
}

export { Booking };
export type { BookingAttributes, BookingCreationAttributes };
