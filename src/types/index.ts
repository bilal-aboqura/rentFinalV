// ============================================================
// Shared TypeScript Type Definitions
// Airport Transfer and Driver Booking System
// ============================================================

export type LocationType = 'city' | 'airport';
export type LocationStatus = 'active' | 'inactive';
export type DriverStatus = 'active' | 'inactive';
export type VehicleClass = 'standard' | 'executive' | 'van';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type NotificationType = 'admin_new_booking' | 'customer_status_change';

// ----------------------------------------------------------------
// Location
// ----------------------------------------------------------------
export interface Location {
  id: string;
  name: string;
  type: LocationType;
  status: LocationStatus;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------
// Driver
// ----------------------------------------------------------------
export interface Driver {
  id: string;
  name: string;
  phone: string;
  license_plate: string;
  status: DriverStatus;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------
// Pricing Rule (RoutePrice) — Spec 003
// ----------------------------------------------------------------
export interface RoutePrice {
  id: string;
  pickup_location_id: string;
  destination_location_id: string;
  price: number;
  created_at: string;
  // Joined fields for display
  pickup_location_name?: string;
  destination_location_name?: string;
}

/** @deprecated Use RoutePrice instead */
export interface PricingRule extends RoutePrice {
  vehicle_class?: VehicleClass;
  updated_at?: string;
  pickup_location?: Location;
  destination_location?: Location;
}

// ----------------------------------------------------------------
// Booking
// ----------------------------------------------------------------
export interface Booking {
  id: string;
  reference_id: string;
  pickup_location_id: string;
  destination_location_id: string;
  trip_date_time: string;
  vehicle_class: VehicleClass;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_price: number;
  status: BookingStatus;
  driver_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (optional)
  pickup_location?: Location;
  destination_location?: Location;
  driver?: Driver | null;
}

// ----------------------------------------------------------------
// Content
// ----------------------------------------------------------------
export interface Content {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------
// Notification
// ----------------------------------------------------------------
export interface Notification {
  id: string;
  recipient_email: string | null;
  message: string;
  type: NotificationType;
  read_status: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------
// Server Action Response Wrapper
// ----------------------------------------------------------------
export type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; validationErrors?: Record<string, string[]> };

// ----------------------------------------------------------------
// Input Types (for Server Actions)
// ----------------------------------------------------------------
export interface CreateBookingInput {
  pickupLocationId: string;
  destinationLocationId: string;
  tripDateTime: string; // ISO String
  vehicleClass: VehicleClass;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export interface CreateDriverInput {
  name: string;
  phone: string;
  licensePlate: string;
}

export interface UpdateDriverInput {
  id: string;
  name?: string;
  phone?: string;
  licensePlate?: string;
  status?: DriverStatus;
}

export interface CreateLocationInput {
  name: string;
  type: LocationType;
}

export interface UpdateLocationInput {
  id: string;
  name?: string;
  type?: LocationType;
  status?: LocationStatus;
}

export interface CreateRoutePriceInput {
  pickupLocationId: string;
  destinationLocationId: string;
  price: number;
}

export interface UpdateRoutePriceInput {
  id: string;
  pickupLocationId?: string;
  destinationLocationId?: string;
  price?: number;
}

/** @deprecated Use CreateRoutePriceInput */
export interface CreatePricingRuleInput extends CreateRoutePriceInput {
  vehicleClass?: VehicleClass;
}

/** @deprecated Use UpdateRoutePriceInput */
export interface UpdatePricingRuleInput extends UpdateRoutePriceInput {}

export interface UpdateContentInput {
  key: string;
  value: string;
}

// ----------------------------------------------------------------
// Dashboard / Pagination Helpers
// ----------------------------------------------------------------
export interface BookingFilters {
  search?: string;
  status?: BookingStatus | 'all';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
