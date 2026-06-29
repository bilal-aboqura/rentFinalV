import { api } from './api';
import type { LocationOption } from '../components/BookingForm';

export interface Location extends LocationOption {
  status: 'active' | 'inactive';
}

export function fetchLocations(): Promise<Location[]> {
  return api.get<Location[]>('/api/locations');
}
