// ============================================================
// Shared TypeScript Type Definitions
// Airport Transfer and Driver Booking System
// ============================================================

export type LocationType = 'city' | 'airport';
export type LocationStatus = 'active' | 'inactive';
export type DriverStatus = 'active' | 'inactive';
export type VehicleClass = 'standard' | 'executive' | 'van';
export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Assigned'
  | 'Completed'
  | 'Cancelled';
export type NotificationType = 'admin_new_booking' | 'customer_status_change';
export type PaymentMethod = 'cash' | 'card_pos' | 'bank_transfer';
export type TripType = 'one_way' | 'round_trip';
export type EndpointType = 'airport' | 'hotel' | 'address' | 'other';
export type BookingLanguage = 'ar' | 'en';

export interface HospitalityOption {
  id: string;
  name: string;
  name_ar: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveHospitalityOptionInput {
  id?: string;
  name: string;
  name_ar: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface BookingHospitalitySelection {
  option_id: string;
  name: string;
  name_ar: string;
  quantity: number;
}

// ----------------------------------------------------------------
// Location
// ----------------------------------------------------------------
export interface Location {
  id: string;
  name: string;
  name_ar: string | null;
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
// Car catalog (maps to a VehicleClass for pricing)
// ----------------------------------------------------------------
export interface Car {
  id: string;
  name: string;
  name_ar: string;
  vehicle_class: VehicleClass;
  passenger_capacity: number;
  luggage_capacity: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCarInput {
  name: string;
  name_ar: string;
  vehicle_class: VehicleClass;
  passenger_capacity: number;
  luggage_capacity: number;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
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
  customer_email: string | null;
  customer_phone: string;
  total_price: number;
  status: BookingStatus;
  driver_id: string | null;
  // Transfer-flow fields (migration 20260705000001)
  trip_type: TripType;
  pickup_type: EndpointType;
  pickup_text: string;
  dropoff_type: EndpointType;
  dropoff_text: string;
  flight_number: string | null;
  return_date_time: string | null;
  return_pickup_location_id: string | null;
  return_destination_location_id: string | null;
  return_flight_number: string | null;
  car_id: string | null;
  language: BookingLanguage;
  notes: string | null;
  payment_method: PaymentMethod;
  passenger_count: number;
  hospitality_selections: BookingHospitalitySelection[];
  // WhatsApp handoff / display fields (migration 20260704000008)
  departure_airport: string;
  arrival_airport: string;
  ticket_number: string;
  vehicle_name: string;
  driver_phone: string;
  created_at: string;
  updated_at: string;
  // Joined fields (optional)
  pickup_location?: Location;
  destination_location?: Location;
  driver?: Driver | null;
  car?: Car | null;
}

/** Price quote for a specific car on a route. */
export interface CarPriceQuote {
  car: Car;
  vehicle_class: VehicleClass;
  price: number;
  available: boolean;
}

export interface PublicFleetCar {
  id: string;
  name: string;
  name_ar: string;
  passenger_capacity: number;
  luggage_capacity: number;
  image_url: string | null;
  sort_order: number;
  starting_price: number | null;
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
// Site Settings (CMS)
// ----------------------------------------------------------------
export interface SiteSettings {
  id: 1;
  hero_title: string;
  about_text: string;
  contact_phone: string;
  contact_email: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  hero_image_url: string | null;
  site_logo_url: string | null;
  // Bank transfer details (migration 20260705000002)
  bank_name: string;
  account_holder_name: string;
  iban: string;
  bank_qr_url: string | null;
  whatsapp_number: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  iban: string;
  qr_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveBankAccountInput {
  id?: string;
  bank_name: string;
  account_holder_name: string;
  iban: string;
  qr_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export type UpdateSiteSettingsInput = Pick<
  SiteSettings,
  | 'hero_title'
  | 'about_text'
  | 'contact_phone'
  | 'contact_email'
  | 'brand_primary_color'
  | 'brand_secondary_color'
> & Partial<Pick<SiteSettings, 'bank_name' | 'account_holder_name' | 'iban' | 'whatsapp_number'>>;

export type SiteAssetType = 'logo' | 'hero';

export interface HomepagePriceCard {
  id: string;
  name: string;
  price: number;
  passenger_capacity: number;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateHomepagePriceCardInput {
  name: string;
  price: number;
  passenger_capacity: number;
}

export interface UpdateHomepagePriceCardInput {
  id: string;
  name: string;
  price: number;
  passenger_capacity: number;
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
export type UpdatePricingRuleInput = UpdateRoutePriceInput;

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
