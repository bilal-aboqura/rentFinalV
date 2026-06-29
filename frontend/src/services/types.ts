export type VehicleClass = 'standard' | 'executive' | 'van';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type NotificationType = 'admin_new_booking' | 'customer_status_change';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_BADGE_CLASSES: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};
