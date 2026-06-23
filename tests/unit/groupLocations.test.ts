import { describe, it, expect } from 'vitest';
import {
  filterActiveLocations,
  groupLocationsByType,
  LOCATION_GROUP_LABELS,
} from '@/lib/utils/groupLocations';
import { Location } from '@/types';

const makeLocation = (
  id: string,
  name: string,
  type: Location['type'],
  isActive: boolean
): Location => ({
  id,
  name,
  type,
  isActive,
  createdAt: '2026-06-23T17:00:00Z',
});

describe('filterActiveLocations', () => {
  it('should remove all inactive locations', () => {
    const locations = [
      makeLocation('1', 'Paris', 'City', true),
      makeLocation('2', 'JFK Airport', 'Airport', false),
      makeLocation('3', 'Orly', 'Airport', true),
    ];

    const result = filterActiveLocations(locations);

    expect(result).toHaveLength(2);
    expect(result.every(l => l.isActive)).toBe(true);
    expect(result.find(l => l.name === 'JFK Airport')).toBeUndefined();
  });

  it('should sort active locations alphabetically by name', () => {
    const locations = [
      makeLocation('1', 'Zurich', 'City', true),
      makeLocation('2', 'Amsterdam', 'City', true),
      makeLocation('3', 'Berlin', 'City', true),
    ];

    const result = filterActiveLocations(locations);

    expect(result.map(l => l.name)).toEqual(['Amsterdam', 'Berlin', 'Zurich']);
  });

  it('should return an empty array for empty input', () => {
    expect(filterActiveLocations([])).toEqual([]);
  });

  it('should filter out 100% of inactive locations', () => {
    const locations = [
      makeLocation('1', 'Active One', 'City', true),
      makeLocation('2', 'Inactive One', 'City', false),
      makeLocation('3', 'Inactive Two', 'Airport', false),
      makeLocation('4', 'Active Two', 'Airport', true),
    ];

    const result = filterActiveLocations(locations);

    expect(result).toHaveLength(2);
    expect(result.some(l => !l.isActive)).toBe(false);
  });
});

describe('groupLocationsByType', () => {
  it('should group locations under Cities, Airports, and Pickup Points labels', () => {
    const locations = [
      makeLocation('1', 'Paris', 'City', true),
      makeLocation('2', 'Orly', 'Airport', true),
      makeLocation('3', 'Eiffel Tower', 'Pickup Point', true),
    ];

    const result = groupLocationsByType(locations);

    expect(Object.keys(result)).toEqual([
      'Cities',
      'Airports',
      'Pickup Points',
    ]);
    expect(result.Cities.map(l => l.name)).toEqual(['Paris']);
    expect(result.Airports.map(l => l.name)).toEqual(['Orly']);
    expect(result['Pickup Points'].map(l => l.name)).toEqual(['Eiffel Tower']);
  });

  it('should sort locations alphabetically within each group', () => {
    const locations = [
      makeLocation('1', 'Zurich', 'City', true),
      makeLocation('2', 'Amsterdam', 'City', true),
      makeLocation('3', 'Berlin', 'City', true),
      makeLocation('4', 'JFK', 'Airport', true),
      makeLocation('5', 'Orly', 'Airport', true),
    ];

    const result = groupLocationsByType(locations);

    expect(result.Cities.map(l => l.name)).toEqual([
      'Amsterdam',
      'Berlin',
      'Zurich',
    ]);
    expect(result.Airports.map(l => l.name)).toEqual(['JFK', 'Orly']);
  });

  it('should always return all three group keys, even when empty', () => {
    const result = groupLocationsByType([]);

    expect(Object.keys(result)).toEqual([
      'Cities',
      'Airports',
      'Pickup Points',
    ]);
    expect(result.Cities).toEqual([]);
    expect(result.Airports).toEqual([]);
    expect(result['Pickup Points']).toEqual([]);
  });

  it('should map each LocationType to the correct group label', () => {
    expect(LOCATION_GROUP_LABELS['City']).toBe('Cities');
    expect(LOCATION_GROUP_LABELS['Airport']).toBe('Airports');
    expect(LOCATION_GROUP_LABELS['Pickup Point']).toBe('Pickup Points');
  });

  it('should handle multiple locations of mixed types correctly', () => {
    const locations = [
      makeLocation('1', 'New York City', 'City', true),
      makeLocation('2', 'Austin', 'City', true),
      makeLocation('3', 'DFW', 'Airport', true),
      makeLocation('4', 'Louvre', 'Pickup Point', true),
      makeLocation('5', 'Arc de Triomphe', 'Pickup Point', true),
    ];

    const result = groupLocationsByType(locations);

    expect(result.Cities).toHaveLength(2);
    expect(result.Airports).toHaveLength(1);
    expect(result['Pickup Points']).toHaveLength(2);
    // Verify alphabetical ordering within Pickup Points
    expect(result['Pickup Points'].map(l => l.name)).toEqual([
      'Arc de Triomphe',
      'Louvre',
    ]);
  });
});
