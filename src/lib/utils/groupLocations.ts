import { Location } from '@/types';

// Maps a LocationType to the customer-facing dropdown group label.
export const LOCATION_GROUP_LABELS: Record<Location['type'], string> = {
  City: 'Cities',
  Airport: 'Airports',
  'Pickup Point': 'Pickup Points',
};

// Stable display order for dropdown optgroups.
export const LOCATION_GROUP_ORDER: readonly string[] = ['Cities', 'Airports', 'Pickup Points'];

// Remove inactive locations and sort the remaining ones alphabetically by name.
export function filterActiveLocations(locations: Location[]): Location[] {
  return locations
    .filter(location => location.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Group locations by their Type under the customer-facing labels
// (Cities, Airports, Pickup Points), sorted alphabetically within each group.
// Always returns all three group keys (empty arrays when no members).
export function groupLocationsByType(locations: Location[]): Record<string, Location[]> {
  const groups: Record<string, Location[]> = {
    Cities: [],
    Airports: [],
    'Pickup Points': [],
  };

  for (const location of locations) {
    const label = LOCATION_GROUP_LABELS[location.type] ?? 'Pickup Points';
    if (!groups[label]) groups[label] = [];
    groups[label].push(location);
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}
