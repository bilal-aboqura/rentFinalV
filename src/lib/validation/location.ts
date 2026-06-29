/**
 * Spec 002: Cities & Airports Management
 * Zod validation schemas and TypeScript types for Locations.
 */
import { z } from 'zod';

// ----------------------------------------------------------------
// Enums
// ----------------------------------------------------------------
export const LocationTypeSchema = z.enum(['City', 'Airport', 'Pickup Point']);
export type LocationType = z.infer<typeof LocationTypeSchema>;

// ----------------------------------------------------------------
// Create Location Schema
// ----------------------------------------------------------------
export const CreateLocationSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Location name must be at least 2 characters long' })
    .max(100, { message: 'Location name cannot exceed 100 characters' })
    .trim(),
  type: LocationTypeSchema,
  isActive: z.boolean().default(true),
});

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;

// ----------------------------------------------------------------
// Update Location Schema
// ----------------------------------------------------------------
export const UpdateLocationSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  name: z
    .string()
    .min(2, { message: 'Location name must be at least 2 characters long' })
    .max(100, { message: 'Location name cannot exceed 100 characters' })
    .trim()
    .optional(),
  type: LocationTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;

// ----------------------------------------------------------------
// TypeScript Interfaces
// ----------------------------------------------------------------
export interface LocationRow {
  id: string;
  name: string;
  type: LocationType;
  is_active: boolean;
  created_at: string;
}

export type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; validationErrors?: Record<string, string[]> };

// ----------------------------------------------------------------
// Format Zod errors into a flat Record
// ----------------------------------------------------------------
export function formatLocationZodErrors(errors: z.ZodError): Record<string, string[]> {
  return errors.flatten().fieldErrors as Record<string, string[]>;
}
