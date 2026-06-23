import { sequelize } from '../../src/config/database';
import { Location } from '../../src/models/Location';
import { Driver } from '../../src/models/Driver';
import { User } from '../../src/models/User';
import { PricingRule } from '../../src/models/PricingRule';
import { Booking } from '../../src/models/Booking';
import { Content } from '../../src/models/Content';
import { Notification } from '../../src/models/Notification';
import bcrypt from 'bcryptjs';

export async function resetDatabase(): Promise<void> {
  const models = [Notification, Booking, PricingRule, Content, Driver, User, Location];
  for (const model of models) {
    await model.destroy({ where: {}, force: true, cascade: false });
  }
}

export async function syncDatabase(): Promise<void> {
  await sequelize.sync({ force: true });
}

interface SeedFixtures {
  cityCenter: Location;
  airport: Location;
  downtown: Location;
  pricingStandard: PricingRule;
  pricingExecutive: PricingRule;
  driver: Driver;
  adminId: number;
}

export async function seedFixtures(): Promise<SeedFixtures> {
  const cityCenter = await Location.create({ name: 'City Center', type: 'city', status: 'active' });
  const airport = await Location.create({
    name: 'International Airport',
    type: 'airport',
    status: 'active',
  });
  const downtown = await Location.create({ name: 'Downtown', type: 'city', status: 'active' });

  const pricingStandard = await PricingRule.create({
    pickupLocationId: cityCenter.id,
    destinationLocationId: airport.id,
    vehicleClass: 'standard',
    price: 45.0,
  });
  const pricingExecutive = await PricingRule.create({
    pickupLocationId: cityCenter.id,
    destinationLocationId: airport.id,
    vehicleClass: 'executive',
    price: 75.0,
  });

  const driver = await Driver.create({
    name: 'James Carter',
    phone: '+12025550141',
    licensePlate: 'JC-100',
    status: 'active',
  });

  const passwordHash = bcrypt.hashSync('SecurePassword123', 10);
  const admin = await User.create({ username: 'admin', passwordHash, role: 'admin' });

  return { cityCenter, airport, downtown, pricingStandard, pricingExecutive, driver, adminId: admin.id };
}

export { sequelize };
