import type { Models } from '../src/models/types.js';

export async function up(models: Models): Promise<void> {
  const { Location } = models;
  const locations = [
    { name: 'City Center', type: 'city' as const, status: 'active' as const },
    { name: 'Downtown', type: 'city' as const, status: 'active' as const },
    { name: 'International Airport', type: 'airport' as const, status: 'active' as const },
    { name: 'Regional Airport', type: 'airport' as const, status: 'active' as const },
  ];
  for (const loc of locations) {
    const exists = await Location.findOne({ where: { name: loc.name } });
    if (!exists) {
      await Location.create(loc);
    }
  }
}
