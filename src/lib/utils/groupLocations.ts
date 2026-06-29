/**
 * T017 [US5] - Utility to group active locations by type and sort alphabetically.
 * Used by the customer-facing booking wizard dropdowns.
 */
import type { LocationRow, LocationType } from '@/lib/validation/location';

export interface GroupedLocations {
  City: LocationRow[];
  Airport: LocationRow[];
  'Pickup Point': LocationRow[];
}

/**
 * Filters inactive locations, groups them by type, and sorts each group alphabetically.
 */
export function groupLocationsByType(locations: LocationRow[]): GroupedLocations {
  const active = locations.filter((l) => l.is_active);

  const grouped: GroupedLocations = {
    City: [],
    Airport: [],
    'Pickup Point': [],
  };

  for (const loc of active) {
    if (loc.type in grouped) {
      grouped[loc.type as LocationType].push(loc);
    }
  }

  grouped.City = sortAlphabetically(grouped.City);
  grouped.Airport = sortAlphabetically(grouped.Airport);
  grouped['Pickup Point'] = sortAlphabetically(grouped['Pickup Point']);

  return grouped;
}

/**
 * Returns a new array of locations sorted alphabetically by name (case-insensitive).
 */
export function sortAlphabetically(locations: LocationRow[]): LocationRow[] {
  return [...locations].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}
