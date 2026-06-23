import { Model, Optional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { NOTIFICATION_TYPES, NotificationType } from './enums';

export interface NotificationAttributes {
  id: number;
  recipientEmail: string | null;
  message: string;
  type: NotificationType;
  readStatus: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, 'id' | 'readStatus' | 'recipientEmail'> {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: number;
  declare recipientEmail: string | null;
  declare message: string;
  declare type: NotificationType;
  declare readStatus: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    recipientEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'recipient_email',
      validate: { isEmail: true },
    },
    message: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    type: { type: DataTypes.ENUM(...NOTIFICATION_TYPES), allowNull: false },
    readStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'read_status',
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    modelName: 'Notification',
  },
);
