import { Model, Optional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { USER_ROLES, UserRole } from './enums';

export interface UserAttributes {
  id: number;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role'> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: number;
  declare username: string;
  declare passwordHash: string;
  declare role: UserRole;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: true } },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash',
      validate: { notEmpty: true },
    },
    role: { type: DataTypes.ENUM(...USER_ROLES), allowNull: false, defaultValue: 'admin' },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
  },
);
