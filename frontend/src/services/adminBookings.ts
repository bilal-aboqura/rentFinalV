import { api } from './api';
import type { VehicleClass, BookingStatus } from './types';

export interface AdminBooking {
  id: number;
  reference_id: string;
  pickup_location_id: number;
  destination_location_id: number;
  trip_date_time: string;
  vehicle_class: VehicleClass;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_price: number;
  status: BookingStatus;
  driver_id: number | null;
  Driver?: { id: number; name: string } | null;
}

export interface AdminBookingsResponse {
  count: number;
  rows: AdminBooking[];
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  search?: string;
}

export function fetchAdminBookings(params: ListParams = {}): Promise<AdminBookingsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  const query = qs.toString();
  return api.get<AdminBookingsResponse>(`/api/admin/bookings${query ? `?${query}` : ''}`);
}

export function updateBookingStatus(
  id: number,
  status: BookingStatus,
): Promise<{ id: number; status: BookingStatus }> {
  return api.patch<{ id: number; status: BookingStatus }>(
    `/api/admin/bookings/${id}/status`,
    { status },
  );
}
