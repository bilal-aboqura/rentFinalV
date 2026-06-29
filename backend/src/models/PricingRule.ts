import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import type { VehicleClass } from '../types/index.js';

interface PricingRuleAttributes {
  id: number;
  pickup_location_id: number;
  destination_location_id: number;
  vehicle_class: VehicleClass;
  price: number;
}

interface PricingRuleCreationAttributes {
  pickup_location_id: number;
  destination_location_id: number;
  vehicle_class: VehicleClass;
  price: number;
}

class PricingRule
  extends Model<PricingRuleAttributes, PricingRuleCreationAttributes>
  implements PricingRuleAttributes
{
  declare id: number;
  declare pickup_location_id: number;
  declare destination_location_id: number;
  declare vehicle_class: VehicleClass;
  declare price: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

PricingRule.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
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
    vehicle_class: {
      type: DataTypes.ENUM('standard', 'executive', 'van'),
      allowNull: false,
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
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['pickup_location_id', 'destination_location_id', 'vehicle_class'],
      },
    ],
  },
);

export { PricingRule };
export type { PricingRuleAttributes, PricingRuleCreationAttributes };
