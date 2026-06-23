import { Model, Optional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface ContentAttributes {
  id: number;
  key: string;
  value: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentCreationAttributes
  extends Optional<ContentAttributes, 'id' | 'description'> {}

export class Content
  extends Model<ContentAttributes, ContentCreationAttributes>
  implements ContentAttributes
{
  declare id: number;
  declare key: string;
  declare value: string;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Content.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: true } },
    value: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    description: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    tableName: 'content',
    modelName: 'Content',
  },
);
