import api, { isApiErrorStatus } from './api';
import type { BookingDTO, BookingPayload, PriceQuoteDTO, VehicleClass } from '../types';

export async function getPriceQuote(params: {
  pickupLocationId: number;
  destinationLocationId: number;
  vehicleClass: VehicleClass;
}): Promise<number | null> {
  try {
    const { data } = await api.get<PriceQuoteDTO>('/api/bookings/price', {
      params: {
        pickup_location_id: params.pickupLocationId,
        destination_location_id: params.destinationLocationId,
        vehicle_class: params.vehicleClass,
      },
    });
    return data.price;
  } catch (err) {
    if (isApiErrorStatus(err, 404)) return null;
    throw err;
  }
}

export async function createBooking(payload: BookingPayload): Promise<BookingDTO> {
  const { data } = await api.post<BookingDTO>('/api/bookings', payload);
  return data;
}
