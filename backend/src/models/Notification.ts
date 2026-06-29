import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import type { NotificationType } from '../types/index.js';

interface NotificationAttributes {
  id: number;
  recipient_email: string | null;
  message: string;
  type: NotificationType;
  read_status: boolean;
}

interface NotificationCreationAttributes {
  recipient_email?: string | null;
  message: string;
  type: NotificationType;
  read_status?: boolean;
}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: number;
  declare recipient_email: string | null;
  declare message: string;
  declare type: NotificationType;
  declare read_status: boolean;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    recipient_email: { type: DataTypes.STRING, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.ENUM('admin_new_booking', 'customer_status_change'),
      allowNull: false,
    },
    read_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    modelName: 'Notification',
    timestamps: true,
  },
);

export { Notification };
export type { NotificationAttributes, NotificationCreationAttributes };
