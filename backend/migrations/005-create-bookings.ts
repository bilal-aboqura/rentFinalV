import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('bookings', {
    id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
    reference_id: { type: 'STRING', allowNull: false, unique: true },
    pickup_location_id: {
      type: 'INTEGER',
      allowNull: false,
      references: { model: 'locations', key: 'id' },
      onDelete: 'RESTRICT',
    },
    destination_location_id: {
      type: 'INTEGER',
      allowNull: false,
      references: { model: 'locations', key: 'id' },
      onDelete: 'RESTRICT',
    },
    trip_date_time: { type: 'DATE', allowNull: false },
    vehicle_class: {
      type: 'ENUM("standard", "executive", "van")',
      allowNull: false,
    },
    customer_name: { type: 'STRING', allowNull: false },
    customer_email: { type: 'STRING', allowNull: false },
    customer_phone: { type: 'STRING', allowNull: false },
    total_price: { type: 'DECIMAL(10,2)', allowNull: false },
    status: {
      type: 'ENUM("pending", "confirmed", "completed", "cancelled")',
      allowNull: false,
      defaultValue: 'pending',
    },
    driver_id: {
      type: 'INTEGER',
      allowNull: true,
      references: { model: 'drivers', key: 'id' },
      onDelete: 'SET NULL',
    },
    created_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('bookings');
}
