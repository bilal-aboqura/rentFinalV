import { Model, Optional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { VEHICLE_CLASSES, VehicleClass } from './enums';

export interface PricingRuleAttributes {
  id: number;
  pickupLocationId: number;
  destinationLocationId: number;
  vehicleClass: VehicleClass;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PricingRuleCreationAttributes
  extends Optional<PricingRuleAttributes, 'id'> {}

export class PricingRule
  extends Model<PricingRuleAttributes, PricingRuleCreationAttributes>
  implements PricingRuleAttributes
{
  declare id: number;
  declare pickupLocationId: number;
  declare destinationLocationId: number;
  declare vehicleClass: VehicleClass;
  declare price: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PricingRule.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
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
    vehicleClass: {
      type: DataTypes.ENUM(...VEHICLE_CLASSES),
      allowNull: false,
      field: 'vehicle_class',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
  },
  {
    sequelize,
    tableName: 'pricing_rules',
    modelName: 'PricingRule',
    indexes: [
      {
        unique: true,
        fields: ['pickup_location_id', 'destination_location_id', 'vehicle_class'],
        name: 'pricing_rules_route_vehicle_unique',
      },
    ],
  },
);
