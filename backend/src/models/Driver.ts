import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import type { EntityStatus } from '../types/index.js';

interface DriverAttributes {
  id: number;
  name: string;
  phone: string;
  license_plate: string;
  status: EntityStatus;
}

interface DriverCreationAttributes {
  name: string;
  phone: string;
  license_plate: string;
  status?: EntityStatus;
}

class Driver
  extends Model<DriverAttributes, DriverCreationAttributes>
  implements DriverAttributes
{
  declare id: number;
  declare name: string;
  declare phone: string;
  declare license_plate: string;
  declare status: EntityStatus;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Driver.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    license_plate: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'drivers',
    modelName: 'Driver',
    timestamps: true,
  },
);

export { Driver };
export type { DriverAttributes, DriverCreationAttributes };
