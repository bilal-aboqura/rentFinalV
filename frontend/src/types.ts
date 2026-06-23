export interface LocationDTO {
  id: number;
  name: string;
  type: 'city' | 'airport';
  status: 'active' | 'inactive';
}

export type VehicleClass = 'standard' | 'executive' | 'van';

export interface PriceQuoteDTO {
  pickup_location_id: number;
  destination_location_id: number;
  vehicle_class: VehicleClass;
  price: number;
}

export interface BookingPayload {
  pickup_location_id: number;
  destination_location_id: number;
  trip_date_time: string;
  vehicle_class: VehicleClass;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export interface BookingDTO {
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  driver_id: number | null;
}

export interface BookingListItemDTO {
  id: number;
  reference_id: string;
  trip_date_time: string;
  customer_name: string;
  customer_email: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  Driver: { id: number; name: string } | null;
}

export interface PaginatedBookingsDTO {
  count: number;
  rows: BookingListItemDTO[];
}

export interface DriverDTO {
  id: number;
  name: string;
  phone: string;
  license_plate: string;
  status: 'active' | 'inactive';
}

export interface PricingRuleDTO {
  id: number;
  pickup_location_id: number;
  destination_location_id: number;
  vehicle_class: VehicleClass;
  price: number;
}

export interface AdminUserDTO {
  username: string;
  role: 'admin';
}

export interface NotificationDTO {
  id: number;
  recipient_email: string | null;
  message: string;
  type: 'admin_new_booking' | 'customer_status_change';
  read_status: boolean;
  created_at: string;
}
