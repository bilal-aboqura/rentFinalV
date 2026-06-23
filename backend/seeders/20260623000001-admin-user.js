'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const passwordHash = bcrypt.hashSync('SecurePassword123', 10);
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password_hash: passwordHash,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
