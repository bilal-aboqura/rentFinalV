'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. locations
    await queryInterface.createTable('locations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      type: { type: Sequelize.ENUM('city', 'airport'), allowNull: false },
      status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // 2. drivers
    await queryInterface.createTable('drivers', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: false },
      license_plate: { type: Sequelize.STRING, allowNull: false, unique: true },
      status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // 3. users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM('admin'), allowNull: false, defaultValue: 'admin' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // 4. pricing_rules
    await queryInterface.createTable('pricing_rules', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      pickup_location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      destination_location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      vehicle_class: { type: Sequelize.ENUM('standard', 'executive', 'van'), allowNull: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('pricing_rules', {
      fields: ['pickup_location_id', 'destination_location_id', 'vehicle_class'],
      unique: true,
      name: 'pricing_rules_route_vehicle_unique',
    });

    // 5. bookings
    await queryInterface.createTable('bookings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      reference_id: { type: Sequelize.STRING, allowNull: false, unique: true },
      pickup_location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      destination_location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      trip_date_time: { type: Sequelize.DATE, allowNull: false },
      vehicle_class: { type: Sequelize.ENUM('standard', 'executive', 'van'), allowNull: false },
      customer_name: { type: Sequelize.STRING, allowNull: false },
      customer_email: { type: Sequelize.STRING, allowNull: false },
      customer_phone: { type: Sequelize.STRING, allowNull: false },
      total_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'drivers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // 6. content
    await queryInterface.createTable('content', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      key: { type: Sequelize.STRING, allowNull: false, unique: true },
      value: { type: Sequelize.TEXT, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // 7. notifications
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      recipient_email: { type: Sequelize.STRING, allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: false },
      type: {
        type: Sequelize.ENUM('admin_new_booking', 'customer_status_change'),
        allowNull: false,
      },
      read_status: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    const tables = [
      'notifications',
      'content',
      'bookings',
      'pricing_rules',
      'users',
      'drivers',
      'locations',
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  },
};
