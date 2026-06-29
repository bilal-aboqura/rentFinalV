import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('notifications', {
    id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
    recipient_email: { type: 'STRING', allowNull: true },
    message: { type: 'TEXT', allowNull: false },
    type: {
      type: 'ENUM("admin_new_booking", "customer_status_change")',
      allowNull: false,
    },
    read_status: {
      type: 'BOOLEAN',
      allowNull: false,
      defaultValue: false,
    },
    created_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('notifications');
}
