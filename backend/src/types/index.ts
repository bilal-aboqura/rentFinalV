import dotenv from 'dotenv';

dotenv.config();

export type VehicleClass = 'standard' | 'executive' | 'van';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type LocationType = 'city' | 'airport';
export type EntityStatus = 'active' | 'inactive';
export type NotificationType = 'admin_new_booking' | 'customer_status_change';
export type UserRole = 'admin';

export const VEHICLE_CLASSES: VehicleClass[] = ['standard', 'executive', 'van'];
export const BOOKING_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
];

export interface JwtUser {
  id: number;
  username: string;
  role: UserRole;
}

export interface AuthedRequest extends Express.Request {
  user?: JwtUser;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
