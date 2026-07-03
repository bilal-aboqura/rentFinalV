import type { LocationRow } from '@/lib/validation/location';

export interface GroupedLocations {
  City: LocationRow[];
  Airport: LocationRow[];
  'Pickup Point': LocationRow[];
}

export function groupLocationsByType(locations: LocationRow[]): GroupedLocations {
  const active = locations.filter((location) => location.status === 'active');

  const grouped: GroupedLocations = {
    City: [],
    Airport: [],
    'Pickup Point': [],
  };

  for (const location of active) {
    if (location.type === 'city') {
      grouped.City.push(location);
      continue;
    }

    if (location.type === 'airport') {
      grouped.Airport.push(location);
    }
  }

  grouped.City = sortAlphabetically(grouped.City);
  grouped.Airport = sortAlphabetically(grouped.Airport);
  return grouped;
}

export function sortAlphabetically(locations: LocationRow[]): LocationRow[] {
  return [...locations].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}
