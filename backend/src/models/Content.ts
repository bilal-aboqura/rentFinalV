import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

interface ContentAttributes {
  id: number;
  key: string;
  value: string;
  description: string | null;
}

interface ContentCreationAttributes {
  key: string;
  value: string;
  description?: string | null;
}

class Content
  extends Model<ContentAttributes, ContentCreationAttributes>
  implements ContentAttributes
{
  declare id: number;
  declare key: string;
  declare value: string;
  declare description: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Content.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    tableName: 'content',
    modelName: 'Content',
    timestamps: true,
  },
);

export { Content };
export type { ContentAttributes, ContentCreationAttributes };
