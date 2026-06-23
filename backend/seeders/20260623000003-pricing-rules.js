'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const locations = await Sequelize.query('SELECT id, name FROM locations;', {
      type: Sequelize.QueryTypes.SELECT,
    });
    const byName = Object.fromEntries(locations.map((l) => [l.name, l.id]));
    const cityCenter = byName['City Center'];
    const airport = byName['International Airport'];
    const downtown = byName['Downtown'];
    const northTerminal = byName['North Terminal'];

    const rules = [];
    const push = (pickup, destination, vehicleClass, price) => {
      if (pickup && destination) {
        rules.push({
          pickup_location_id: pickup,
          destination_location_id: destination,
          vehicle_class: vehicleClass,
          price,
          created_at: now,
          updated_at: now,
        });
      }
    };

    push(cityCenter, airport, 'standard', 45.0);
    push(cityCenter, airport, 'executive', 75.0);
    push(cityCenter, airport, 'van', 120.0);
    push(airport, cityCenter, 'standard', 45.0);
    push(airport, cityCenter, 'executive', 75.0);
    push(airport, cityCenter, 'van', 120.0);
    push(downtown, airport, 'standard', 55.0);
    push(downtown, airport, 'executive', 90.0);
    push(downtown, northTerminal, 'standard', 60.0);
    push(downtown, northTerminal, 'van', 140.0);

    await queryInterface.bulkInsert('pricing_rules', rules, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('pricing_rules', null, {});
  },
};
