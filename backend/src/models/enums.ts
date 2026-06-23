export const LOCATION_TYPES = ['city', 'airport'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const ENTITY_STATUS = ['active', 'inactive'] as const;
export type EntityStatus = (typeof ENTITY_STATUS)[number];

export const VEHICLE_CLASSES = ['standard', 'executive', 'van'] as const;
export type VehicleClass = (typeof VEHICLE_CLASSES)[number];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const USER_ROLES = ['admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const NOTIFICATION_TYPES = ['admin_new_booking', 'customer_status_change'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
