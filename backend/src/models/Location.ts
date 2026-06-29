import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import type { LocationType, EntityStatus } from '../types/index.js';

interface LocationAttributes {
  id: number;
  name: string;
  type: LocationType;
  status: EntityStatus;
}

interface LocationCreationAttributes {
  name: string;
  type: LocationType;
  status?: EntityStatus;
}

class Location
  extends Model<LocationAttributes, LocationCreationAttributes>
  implements LocationAttributes
{
  declare id: number;
  declare name: string;
  declare type: LocationType;
  declare status: EntityStatus;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Location.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: {
      type: DataTypes.ENUM('city', 'airport'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'locations',
    modelName: 'Location',
    timestamps: true,
  },
);

export { Location };
export type { LocationAttributes, LocationCreationAttributes };
