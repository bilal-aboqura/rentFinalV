import type { Request } from 'express';
import type { Booking } from '../models/Booking';
import type { Location } from '../models/Location';
import type { Driver } from '../models/Driver';
import type { PricingRule } from '../models/PricingRule';

export interface SerializedBooking {
  id: number;
  reference_id: string;
  pickup_location_id: number;
  destination_location_id: number;
  trip_date_time: string;
  vehicle_class: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_price: number;
  status: string;
  driver_id: number | null;
}

export function serializeBooking(booking: Booking): SerializedBooking {
  return {
    id: booking.id,
    reference_id: booking.referenceId,
    pickup_location_id: booking.pickupLocationId,
    destination_location_id: booking.destinationLocationId,
    trip_date_time: booking.tripDateTime.toISOString(),
    vehicle_class: booking.vehicleClass,
    customer_name: booking.customerName,
    customer_email: booking.customerEmail,
    customer_phone: booking.customerPhone,
    total_price: Number(booking.totalPrice),
    status: booking.status,
    driver_id: booking.driverId,
  };
}

export function serializeLocation(location: Location): {
  id: number;
  name: string;
  type: string;
  status: string;
} {
  return {
    id: location.id,
    name: location.name,
    type: location.type,
    status: location.status,
  };
}

export function serializeDriver(driver: Driver): {
  id: number;
  name: string;
  phone: string;
  license_plate: string;
  status: string;
} {
  return {
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    license_plate: driver.licensePlate,
    status: driver.status,
  };
}

export function serializePricingRule(rule: PricingRule): {
  id: number;
  pickup_location_id: number;
  destination_location_id: number;
  vehicle_class: string;
  price: number;
} {
  return {
    id: rule.id,
    pickup_location_id: rule.pickupLocationId,
    destination_location_id: rule.destinationLocationId,
    vehicle_class: rule.vehicleClass,
    price: Number(rule.price),
  };
}

export interface BookingWithDriver extends Booking {
  driver?: Driver | null;
}

export function serializeBookingListItem(booking: BookingWithDriver): unknown {
  return {
    id: booking.id,
    reference_id: booking.referenceId,
    trip_date_time: booking.tripDateTime.toISOString(),
    customer_name: booking.customerName,
    customer_email: booking.customerEmail,
    customer_phone: booking.customerPhone,
    total_price: Number(booking.totalPrice),
    status: booking.status,
    vehicle_class: booking.vehicleClass,
    Driver: booking.driver ? { id: booking.driver.id, name: booking.driver.name } : null,
  };
}

export function getPagination(req: Request): { page: number; limit: number; offset: number } {
  const page = Math.max(parseInt(String(req.query.page), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
}
