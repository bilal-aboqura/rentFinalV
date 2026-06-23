import api, { getApiErrorMessage } from './api';
import type {
  AdminUserDTO,
  PaginatedBookingsDTO,
  BookingListItemDTO,
  VehicleClass,
  DriverDTO,
  LocationDTO,
  PricingRuleDTO,
} from '../types';

export async function adminLogin(username: string, password: string): Promise<AdminUserDTO> {
  const { data } = await api.post<{ success: boolean; user: AdminUserDTO }>('/api/admin/login', {
    username,
    password,
  });
  return data.user;
}

export async function adminLogout(): Promise<void> {
  await api.post('/api/admin/logout');
}

export async function fetchCurrentAdmin(): Promise<AdminUserDTO | null> {
  try {
    const { data } = await api.get<{ user: AdminUserDTO | null }>('/api/admin/me');
    return data.user;
  } catch (err) {
    return null;
  }
}

export async function fetchAdminBookings(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<PaginatedBookingsDTO> {
  const { data } = await api.get<PaginatedBookingsDTO>('/api/admin/bookings', { params });
  return data;
}

export async function updateBookingStatus(id: number, status: string): Promise<{ id: number; status: string }> {
  const { data } = await api.patch(`/api/admin/bookings/${id}/status`, { status });
  return data;
}

export async function assignDriver(id: number, driverId: number): Promise<{ id: number; driver_id: number }> {
  const { data } = await api.patch(`/api/admin/bookings/${id}/driver`, { driver_id: driverId });
  return data;
}

export async function fetchDrivers(): Promise<DriverDTO[]> {
  const { data } = await api.get<DriverDTO[]>('/api/admin/drivers');
  return data;
}

export async function createDriver(input: {
  name: string;
  phone: string;
  license_plate: string;
}): Promise<DriverDTO> {
  const { data } = await api.post<DriverDTO>('/api/admin/drivers', input);
  return data;
}

export async function updateDriver(
  id: number,
  input: Partial<{ name: string; phone: string; license_plate: string; status: string }>,
): Promise<DriverDTO> {
  const { data } = await api.patch<DriverDTO>(`/api/admin/drivers/${id}`, input);
  return data;
}

export async function deleteDriver(id: number): Promise<void> {
  await api.delete(`/api/admin/drivers/${id}`);
}

export async function fetchAdminLocations(): Promise<LocationDTO[]> {
  const { data } = await api.get<LocationDTO[]>('/api/admin/locations');
  return data;
}

export async function createLocation(input: {
  name: string;
  type: 'city' | 'airport';
  status?: string;
}): Promise<LocationDTO> {
  const { data } = await api.post<LocationDTO>('/api/admin/locations', input);
  return data;
}

export async function updateLocation(
  id: number,
  input: Partial<{ name: string; type: 'city' | 'airport'; status: string }>,
): Promise<LocationDTO> {
  const { data } = await api.patch<LocationDTO>(`/api/admin/locations/${id}`, input);
  return data;
}

export async function deleteLocation(id: number): Promise<void> {
  await api.delete(`/api/admin/locations/${id}`);
}

export async function fetchPricingRules(): Promise<PricingRuleDTO[]> {
  const { data } = await api.get<PricingRuleDTO[]>('/api/admin/pricing-rules');
  return data;
}

export async function createPricingRule(input: {
  pickup_location_id: number;
  destination_location_id: number;
  vehicle_class: VehicleClass;
  price: number;
}): Promise<PricingRuleDTO> {
  const { data } = await api.post<PricingRuleDTO>('/api/admin/pricing-rules', input);
  return data;
}

export async function updatePricingRule(id: number, input: { price: number }): Promise<PricingRuleDTO> {
  const { data } = await api.patch<PricingRuleDTO>(`/api/admin/pricing-rules/${id}`, input);
  return data;
}

export async function deletePricingRule(id: number): Promise<void> {
  await api.delete(`/api/admin/pricing-rules/${id}`);
}

export { getApiErrorMessage };
export type { BookingListItemDTO, VehicleClass };
