import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('users', {
    id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
    username: { type: 'STRING', allowNull: false, unique: true },
    password_hash: { type: 'STRING', allowNull: false },
    role: { type: 'STRING', allowNull: false, defaultValue: 'admin' },
    created_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('users');
}
