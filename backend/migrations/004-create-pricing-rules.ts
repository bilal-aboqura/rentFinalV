import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('pricing_rules', {
    id: { type: 'INTEGER', autoIncrement: true, primaryKey: true },
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
    vehicle_class: {
      type: 'ENUM("standard", "executive", "van")',
      allowNull: false,
    },
    price: { type: 'DECIMAL(10,2)', allowNull: false },
    created_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
    updated_at: { type: 'DATE', allowNull: false, defaultValue: new Date() },
  });

  await queryInterface.addIndex('pricing_rules', {
    unique: true,
    fields: ['pickup_location_id', 'destination_location_id', 'vehicle_class'],
    name: 'pricing_rules_route_vehicle_unique',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex(
    'pricing_rules',
    'pricing_rules_route_vehicle_unique',
  );
  await queryInterface.dropTable('pricing_rules');
}
