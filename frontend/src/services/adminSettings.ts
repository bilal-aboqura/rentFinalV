import { api } from './api';
import type { VehicleClass } from './types';

export interface Driver {
  id: number;
  name: string;
  phone: string;
  license_plate: string;
  status: 'active' | 'inactive';
}

export interface AdminLocation {
  id: number;
  name: string;
  type: 'city' | 'airport';
  status: 'active' | 'inactive';
}

export interface PricingRule {
  id: number;
  pickup_location_id: number;
  destination_location_id: number;
  vehicle_class: VehicleClass;
  price: number;
  pickupLocation?: AdminLocation;
  destinationLocation?: AdminLocation;
}

// ---------- Drivers ----------
export function fetchDrivers(): Promise<Driver[]> {
  return api.get<Driver[]>('/api/admin/drivers');
}
export function createDriver(
  payload: Omit<Driver, 'id' | 'status'> & { status?: 'active' | 'inactive' },
): Promise<Driver> {
  return api.post<Driver>('/api/admin/drivers', payload);
}
export function updateDriver(
  id: number,
  payload: Partial<Omit<Driver, 'id'>>,
): Promise<Driver> {
  return api.patch<Driver>(`/api/admin/drivers/${id}`, payload);
}
export function deleteDriver(id: number): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/api/admin/drivers/${id}`);
}

// ---------- Locations ----------
export function fetchAdminLocations(): Promise<AdminLocation[]> {
  return api.get<AdminLocation[]>('/api/admin/locations');
}
export function createLocation(
  payload: { name: string; type: 'city' | 'airport'; status?: 'active' | 'inactive' },
): Promise<AdminLocation> {
  return api.post<AdminLocation>('/api/admin/locations', payload);
}
export function updateLocation(
  id: number,
  payload: Partial<Omit<AdminLocation, 'id'>>,
): Promise<AdminLocation> {
  return api.patch<AdminLocation>(`/api/admin/locations/${id}`, payload);
}
export function deleteLocation(id: number): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/api/admin/locations/${id}`);
}

// ---------- Pricing Rules ----------
export function fetchPricingRules(): Promise<PricingRule[]> {
  return api.get<PricingRule[]>('/api/admin/pricing-rules');
}
export function createPricingRule(
  payload: Omit<PricingRule, 'id' | 'pickupLocation' | 'destinationLocation'>,
): Promise<PricingRule> {
  return api.post<PricingRule>('/api/admin/pricing-rules', payload);
}
export function updatePricingRule(
  id: number,
  payload: Partial<Omit<PricingRule, 'id' | 'pickupLocation' | 'destinationLocation'>>,
): Promise<PricingRule> {
  return api.patch<PricingRule>(`/api/admin/pricing-rules/${id}`, payload);
}
export function deletePricingRule(id: number): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/api/admin/pricing-rules/${id}`);
}

// ---------- Driver Assignment ----------
export function assignDriver(
  bookingId: number,
  driverId: number,
): Promise<{ id: number; driver_id: number }> {
  return api.patch<{ id: number; driver_id: number }>(
    `/api/admin/bookings/${bookingId}/driver`,
    { driver_id: driverId },
  );
}
