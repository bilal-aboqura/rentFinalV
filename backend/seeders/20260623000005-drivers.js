'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'drivers',
      [
        { name: 'James Carter', phone: '+12025550141', license_plate: 'JC-100', status: 'active', created_at: now, updated_at: now },
        { name: 'Maria Lopez', phone: '+12025550142', license_plate: 'ML-200', status: 'active', created_at: now, updated_at: now },
        { name: 'David Kim', phone: '+12025550143', license_plate: 'DK-300', status: 'inactive', created_at: now, updated_at: now },
      ],
      {},
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('drivers', null, {});
  },
};
