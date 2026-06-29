/**
 * T016 [US5] - Vitest tests for active locations grouping and filtering utilities.
 * Written FIRST following TDD.
 */
import { describe, it, expect } from 'vitest';
import { groupLocationsByType, sortAlphabetically } from '@/lib/utils/groupLocations';
import type { LocationRow } from '@/lib/validation/location';

const mockLocations: LocationRow[] = [
  { id: '1', name: 'Amsterdam', type: 'City', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: '2', name: 'Barcelona', type: 'City', is_active: true, created_at: '2026-01-02T00:00:00Z' },
  { id: '3', name: 'Amsterdam Schiphol', type: 'Airport', is_active: true, created_at: '2026-01-03T00:00:00Z' },
  { id: '4', name: 'Madrid Barajas', type: 'Airport', is_active: true, created_at: '2026-01-04T00:00:00Z' },
  { id: '5', name: 'Central Bus Station', type: 'Pickup Point', is_active: true, created_at: '2026-01-05T00:00:00Z' },
  { id: '6', name: 'Inactive City', type: 'City', is_active: false, created_at: '2026-01-06T00:00:00Z' },
  { id: '7', name: 'Inactive Airport', type: 'Airport', is_active: false, created_at: '2026-01-07T00:00:00Z' },
];

describe('[US5] groupLocationsByType', () => {
  it('filters out inactive locations', () => {
    const groups = groupLocationsByType(mockLocations);
    const allGrouped = [...groups.City, ...groups.Airport, ...groups['Pickup Point']];
    const hasInactive = allGrouped.some((l) => !l.is_active);
    expect(hasInactive).toBe(false);
  });

  it('groups locations by type correctly', () => {
    const groups = groupLocationsByType(mockLocations);
    expect(groups.City).toHaveLength(2);
    expect(groups.Airport).toHaveLength(2);
    expect(groups['Pickup Point']).toHaveLength(1);
  });

  it('returns empty arrays for types with no active locations', () => {
    const onlyAirports: LocationRow[] = [
      { id: '1', name: 'Heathrow', type: 'Airport', is_active: true, created_at: '2026-01-01T00:00:00Z' },
    ];
    const groups = groupLocationsByType(onlyAirports);
    expect(groups.City).toHaveLength(0);
    expect(groups['Pickup Point']).toHaveLength(0);
    expect(groups.Airport).toHaveLength(1);
  });

  it('sorts each group alphabetically', () => {
    const groups = groupLocationsByType(mockLocations);
    expect(groups.City[0].name).toBe('Amsterdam');
    expect(groups.City[1].name).toBe('Barcelona');
    expect(groups.Airport[0].name).toBe('Amsterdam Schiphol');
    expect(groups.Airport[1].name).toBe('Madrid Barajas');
  });

  it('handles an empty array gracefully', () => {
    const groups = groupLocationsByType([]);
    expect(groups.City).toHaveLength(0);
    expect(groups.Airport).toHaveLength(0);
    expect(groups['Pickup Point']).toHaveLength(0);
  });
});

describe('[US5] sortAlphabetically', () => {
  it('sorts an array of locations by name', () => {
    const locs: LocationRow[] = [
      { id: '2', name: 'Zurich', type: 'City', is_active: true, created_at: '' },
      { id: '1', name: 'Amsterdam', type: 'City', is_active: true, created_at: '' },
      { id: '3', name: 'London', type: 'City', is_active: true, created_at: '' },
    ];
    const sorted = sortAlphabetically(locs);
    expect(sorted.map((l) => l.name)).toEqual(['Amsterdam', 'London', 'Zurich']);
  });
});
