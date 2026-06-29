import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('content', {
    id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
    key: { type: 'STRING', allowNull: false, unique: true },
    value: { type: 'TEXT', allowNull: false },
    description: { type: 'STRING', allowNull: true },
    created_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('content');
}
