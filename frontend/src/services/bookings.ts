import { api } from './api';
import type { BookingPayload, BookingResult, VehicleClass } from '../components/BookingForm';

export interface BookingQuote {
  pickup_location_id: number;
  destination_location_id: number;
  vehicle_class: VehicleClass;
  price: number;
}

export interface BookingRecord extends BookingResult {
  id: number;
  reference_id: string;
  status: string;
  total_price: number;
  driver_id: number | null;
}

export function getPriceQuote(
  pickup: number,
  destination: number,
  vehicle: VehicleClass,
): Promise<BookingQuote> {
  const qs = new URLSearchParams({
    pickup_location_id: String(pickup),
    destination_location_id: String(destination),
    vehicle_class: vehicle,
  });
  return api.get<BookingQuote>(`/api/bookings/price?${qs.toString()}`);
}

export function createBooking(payload: BookingPayload): Promise<BookingRecord> {
  return api.post<BookingRecord>('/api/bookings', payload);
}
