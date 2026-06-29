import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';
import type { UserRole } from '../types/index.js';

interface UserAttributes {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
}

interface UserCreationAttributes {
  username: string;
  password_hash: string;
  role?: UserRole;
}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: number;
  declare username: string;
  declare password_hash: string;
  declare role: UserRole;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'admin',
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: true,
  },
);

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export { User };
export type { UserAttributes, UserCreationAttributes };
