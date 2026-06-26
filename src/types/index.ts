// Shared TypeScript Interfaces

export type LocationType = 'City' | 'Airport' | 'Pickup Point';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateLocationInput {
  name: string;
  type: LocationType;
  isActive?: boolean;
}

export interface UpdateLocationInput {
  id: string;
  name?: string;
  type?: LocationType;
  isActive?: boolean;
}

export interface RoutePrice {
  id: string;
  pickupLocationId: string;
  destinationLocationId: string;
  price: number;
  createdAt: string;
  // Joined fields for display
  pickupLocationName?: string;
  destinationLocationName?: string;
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

export interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: { [key in keyof T]?: string[] } | { [key: string]: string[] };
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  availability_status: 'Available' | 'Busy' | 'Inactive';
  created_at: string;
}

export interface CreateDriverInput {
  name: string;
  phone: string;
  availability_status?: 'Available' | 'Busy' | 'Inactive';
}

export interface UpdateDriverInput {
  id: string;
  name?: string;
  phone?: string;
  availability_status?: 'Available' | 'Busy' | 'Inactive';
}

export interface BookingWithDetails {
  id: string;
  booking_reference: string;
  pickup_location_id: string;
  destination_location_id: string;
  booking_date: string;
  booking_time: string;
  price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  flight_number: string | null;
  notes: string | null;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  driver_id: string | null;
  created_at: string;
  pickup: {
    name: string;
  };
  destination: {
    name: string;
  };
  driver: {
    name: string;
  } | null;
}

