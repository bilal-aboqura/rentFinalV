import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('drivers', {
    id: {
      type: 'INTEGER',
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: 'STRING', allowNull: false },
    phone: { type: 'STRING', allowNull: false },
    license_plate: { type: 'STRING', allowNull: false, unique: true },
    status: {
      type: 'ENUM("active", "inactive")',
      allowNull: false,
      defaultValue: 'active',
    },
    created_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('drivers');
}
