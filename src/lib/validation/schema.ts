import { z } from 'zod';

// ----------------------------------------------------------------
// Booking Schema
// ----------------------------------------------------------------
export const createBookingSchema = z.object({
  pickupLocationId: z.string().uuid('Invalid pickup location.'),
  destinationLocationId: z.string().uuid('Invalid destination location.'),
  tripDateTime: z
    .string()
    .datetime({ message: 'Invalid date/time format.' })
    .refine(
      (val) => new Date(val) > new Date(),
      { message: 'Booking date and time must be in the future.' }
    ),
  vehicleClass: z.enum(['standard', 'executive', 'van'], {
    errorMap: () => ({ message: 'Please select a valid vehicle class.' }),
  }),
  customerName: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  customerEmail: z.string().email('Please enter a valid email address.'),
  customerPhone: z
    .string()
    .min(7, 'Phone number must be at least 7 characters.')
    .max(20, 'Phone number is too long.'),
}).refine(
  (data) => data.pickupLocationId !== data.destinationLocationId,
  {
    message: 'Pickup and destination locations must be different.',
    path: ['destinationLocationId'],
  }
);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ----------------------------------------------------------------
// Contact Schema
// ----------------------------------------------------------------
export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().email('Please enter a valid email address.'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters.')
    .max(2000, 'Message is too long.'),
});

export type ContactInput = z.infer<typeof contactSchema>;

// ----------------------------------------------------------------
// Driver Schema
// ----------------------------------------------------------------
export const createDriverSchema = z.object({
  name: z.string().min(2, 'Driver name must be at least 2 characters.').max(100),
  phone: z
    .string()
    .min(7, 'Phone number must be at least 7 characters.')
    .max(20, 'Phone number is too long.'),
  licensePlate: z
    .string()
    .min(2, 'License plate must be at least 2 characters.')
    .max(20, 'License plate is too long.')
    .transform((val) => val.toUpperCase()),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  licensePlate: z.string().min(2).max(20).transform((val) => val.toUpperCase()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

// ----------------------------------------------------------------
// Location Schema
// ----------------------------------------------------------------
export const createLocationSchema = z.object({
  name: z.string().min(2, 'Location name must be at least 2 characters.').max(100),
  type: z.enum(['city', 'airport'], {
    errorMap: () => ({ message: 'Location type must be "city" or "airport".' }),
  }),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  type: z.enum(['city', 'airport']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

// ----------------------------------------------------------------
// Pricing Rule Schema
// ----------------------------------------------------------------
export const createPricingRuleSchema = z.object({
  pickupLocationId: z.string().uuid('Invalid pickup location.'),
  destinationLocationId: z.string().uuid('Invalid destination location.'),
  vehicleClass: z.enum(['standard', 'executive', 'van']),
  price: z
    .number({ invalid_type_error: 'Price must be a number.' })
    .positive('Price must be greater than 0.')
    .max(10000, 'Price is too high.'),
}).refine(
  (data) => data.pickupLocationId !== data.destinationLocationId,
  {
    message: 'Pickup and destination locations must be different.',
    path: ['destinationLocationId'],
  }
);

export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;

export const updatePricingRuleSchema = z.object({
  id: z.string().uuid(),
  price: z
    .number({ invalid_type_error: 'Price must be a number.' })
    .positive('Price must be greater than 0.')
    .max(10000, 'Price is too high.'),
});

export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;

// ----------------------------------------------------------------
// Content Schema
// ----------------------------------------------------------------
export const updateContentSchema = z.object({
  key: z.string().min(1, 'Content key is required.').max(100),
  value: z.string().min(1, 'Content value cannot be empty.').max(5000),
});

export type UpdateContentInput = z.infer<typeof updateContentSchema>;

// ----------------------------------------------------------------
// Helper: Format Zod errors into a flat Record
// ----------------------------------------------------------------
export function formatZodErrors(
  errors: z.ZodError
): Record<string, string[]> {
  return errors.flatten().fieldErrors as Record<string, string[]>;
}
