/**
 * Spec 003: Pricing Management
 * Zod validation schemas and TypeScript types for Route Prices.
 */
import { z } from 'zod';

// ----------------------------------------------------------------
// Create Route Price Schema
// ----------------------------------------------------------------
export const CreateRoutePriceSchema = z
  .object({
    pickupLocationId: z.string().uuid({ message: 'Invalid pickup location ID format' }),
    destinationLocationId: z.string().uuid({ message: 'Invalid destination location ID format' }),
    vehicleClass: z.enum(['standard', 'executive', 'van']),
    price: z
      .number({ invalid_type_error: 'Price must be a valid number' })
      .positive({ message: 'Price must be a positive number greater than zero' }),
  })
  .refine((data) => data.pickupLocationId !== data.destinationLocationId, {
    message: 'Pickup and destination locations must be different',
    path: ['destinationLocationId'],
  });

export type CreateRoutePriceInput = z.infer<typeof CreateRoutePriceSchema>;

// ----------------------------------------------------------------
// Update Route Price Schema
// ----------------------------------------------------------------
export const UpdateRoutePriceSchema = z
  .object({
    id: z.string().uuid({ message: 'Invalid ID format' }),
    pickupLocationId: z
      .string()
      .uuid({ message: 'Invalid pickup location ID format' })
      .optional(),
    destinationLocationId: z
      .string()
      .uuid({ message: 'Invalid destination location ID format' })
      .optional(),
    vehicleClass: z.enum(['standard', 'executive', 'van']).optional(),
    price: z
      .number({ invalid_type_error: 'Price must be a valid number' })
      .positive({ message: 'Price must be a positive number greater than zero' })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.pickupLocationId && data.destinationLocationId) {
        return data.pickupLocationId !== data.destinationLocationId;
      }
      return true;
    },
    {
      message: 'Pickup and destination locations must be different',
      path: ['destinationLocationId'],
    }
  );

export type UpdateRoutePriceInput = z.infer<typeof UpdateRoutePriceSchema>;

// ----------------------------------------------------------------
// TypeScript Interfaces
// ----------------------------------------------------------------
export interface RoutePriceRow {
  id: string;
  pickup_location_id: string;
  destination_location_id: string;
  vehicle_class: 'standard' | 'executive' | 'van';
  price: number;
  created_at: string;
  // Joined fields for display
  pickup_location_name?: string;
  destination_location_name?: string;
}

export interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: { [key: string]: string[] };
}

// ----------------------------------------------------------------
// Format Zod errors into a flat Record
// ----------------------------------------------------------------
export function formatPricingZodErrors(errors: z.ZodError): Record<string, string[]> {
  return errors.flatten().fieldErrors as Record<string, string[]>;
}
