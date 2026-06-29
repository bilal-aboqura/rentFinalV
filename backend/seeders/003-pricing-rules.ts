import type { Models } from '../src/models/types.js';

export async function up(models: Models): Promise<void> {
  const { PricingRule, Location } = models;

  const cityCenter = await Location.findOne({ where: { name: 'City Center' } });
  const downtown = await Location.findOne({ where: { name: 'Downtown' } });
  const intl = await Location.findOne({ where: { name: 'International Airport' } });
  const regional = await Location.findOne({ where: { name: 'Regional Airport' } });

  if (!cityCenter || !downtown || !intl || !regional) {
    throw new Error('Seed locations missing. Run locations seed first.');
  }

  type Rule = {
    pickup: number;
    destination: number;
    vehicle_class: 'standard' | 'executive' | 'van';
    price: number;
  };

  const rules: Rule[] = [
    { pickup: cityCenter.id, destination: intl.id, vehicle_class: 'standard', price: 45.0 },
    { pickup: cityCenter.id, destination: intl.id, vehicle_class: 'executive', price: 75.0 },
    { pickup: cityCenter.id, destination: intl.id, vehicle_class: 'van', price: 110.0 },
    { pickup: downtown.id, destination: intl.id, vehicle_class: 'standard', price: 40.0 },
    { pickup: downtown.id, destination: intl.id, vehicle_class: 'executive', price: 68.0 },
    { pickup: downtown.id, destination: intl.id, vehicle_class: 'van', price: 95.0 },
    { pickup: intl.id, destination: cityCenter.id, vehicle_class: 'standard', price: 50.0 },
    { pickup: intl.id, destination: cityCenter.id, vehicle_class: 'executive', price: 85.0 },
    { pickup: cityCenter.id, destination: regional.id, vehicle_class: 'standard', price: 35.0 },
  ];

  for (const rule of rules) {
    const exists = await PricingRule.findOne({ where: rule });
    if (!exists) {
      await PricingRule.create(rule);
    }
  }
}
