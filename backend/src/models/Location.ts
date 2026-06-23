import { Model, Optional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { LOCATION_TYPES, ENTITY_STATUS, LocationType, EntityStatus } from './enums';

export interface LocationAttributes {
  id: number;
  name: string;
  type: LocationType;
  status: EntityStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LocationCreationAttributes extends Optional<LocationAttributes, 'id' | 'status'> {}

export class Location
  extends Model<LocationAttributes, LocationCreationAttributes>
  implements LocationAttributes
{
  declare id: number;
  declare name: string;
  declare type: LocationType;
  declare status: EntityStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Location.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: true } },
    type: { type: DataTypes.ENUM(...LOCATION_TYPES), allowNull: false },
    status: { type: DataTypes.ENUM(...ENTITY_STATUS), allowNull: false, defaultValue: 'active' },
  },
  {
    sequelize,
    tableName: 'locations',
    modelName: 'Location',
  },
);
