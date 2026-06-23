import api from './api';
import type { LocationDTO } from '../types';

export async function fetchLocations(): Promise<LocationDTO[]> {
  const { data } = await api.get<LocationDTO[]>('/api/locations');
  return data;
}
