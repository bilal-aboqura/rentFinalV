'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'locations',
      [
        { name: 'City Center', type: 'city', status: 'active', created_at: now, updated_at: now },
        { name: 'International Airport', type: 'airport', status: 'active', created_at: now, updated_at: now },
        { name: 'Downtown', type: 'city', status: 'active', created_at: now, updated_at: now },
        { name: 'North Terminal', type: 'airport', status: 'active', created_at: now, updated_at: now },
        { name: 'Harbor District', type: 'city', status: 'inactive', created_at: now, updated_at: now },
      ],
      {},
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('locations', null, {});
  },
};
