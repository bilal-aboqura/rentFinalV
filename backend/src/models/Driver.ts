import { Model, Optional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { ENTITY_STATUS, EntityStatus } from './enums';

export interface DriverAttributes {
  id: number;
  name: string;
  phone: string;
  licensePlate: string;
  status: EntityStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DriverCreationAttributes extends Optional<DriverAttributes, 'id' | 'status'> {}

export class Driver
  extends Model<DriverAttributes, DriverCreationAttributes>
  implements DriverAttributes
{
  declare id: number;
  declare name: string;
  declare phone: string;
  declare licensePlate: string;
  declare status: EntityStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Driver.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    phone: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    licensePlate: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'license_plate',
      validate: { notEmpty: true },
    },
    status: { type: DataTypes.ENUM(...ENTITY_STATUS), allowNull: false, defaultValue: 'active' },
  },
  {
    sequelize,
    tableName: 'drivers',
    modelName: 'Driver',
  },
);
