/**
 * Spec 004: Drivers Management
 * Zod validation schemas and TypeScript types for Driver records.
 */
import { z } from 'zod';

// ----------------------------------------------------------------
// Create Driver Schema
// ----------------------------------------------------------------
export const CreateDriverSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .transform((val) => val.trim()),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 characters long' })
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    // Normalize: remove spaces, dashes, parentheses — keep digits and optional leading +
    .transform((val) => val.replace(/[^\d+]/g, '')),
  availability_status: z
    .enum(['Available', 'Busy', 'Inactive'], {
      errorMap: () => ({ message: 'Invalid availability status' }),
    })
    .default('Available'),
});

export type CreateDriverInput = z.infer<typeof CreateDriverSchema>;

// ----------------------------------------------------------------
// Update Driver Schema
// ----------------------------------------------------------------
export const UpdateDriverSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .transform((val) => val.trim())
    .optional(),
  phone: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 characters long' })
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    .transform((val) => val.replace(/[^\d+]/g, ''))
    .optional(),
  availability_status: z.enum(['Available', 'Busy', 'Inactive']).optional(),
});

export type UpdateDriverInput = z.infer<typeof UpdateDriverSchema>;

// ----------------------------------------------------------------
// Driver interface (matches database schema)
// ----------------------------------------------------------------
export interface DriverRecord {
  id: string;
  name: string;
  phone: string;
  availability_status: 'Available' | 'Busy' | 'Inactive';
  created_at: string;
}

// ----------------------------------------------------------------
// Server Action Response type
// ----------------------------------------------------------------
export type DriverActionResponse<T> =
  | { success: true; data: T }
  | { success: false; validationErrors?: Record<string, string[]>; error?: string };

// ----------------------------------------------------------------
// Format Zod errors into a flat Record
// ----------------------------------------------------------------
export function formatDriverZodErrors(errors: z.ZodError): Record<string, string[]> {
  return errors.flatten().fieldErrors as Record<string, string[]>;
}
