import { z } from 'zod';

export const LocationTypeSchema = z.enum(['city', 'airport']);
export type LocationType = z.infer<typeof LocationTypeSchema>;

export const LocationStatusSchema = z.enum(['active', 'inactive']);
export type LocationStatus = z.infer<typeof LocationStatusSchema>;

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

export interface LocationRow {
  id: string;
  name: string;
  type: LocationType;
  status: LocationStatus;
  created_at: string;
}

export type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; validationErrors?: Record<string, string[]> };

export function formatLocationZodErrors(errors: z.ZodError): Record<string, string[]> {
  return errors.flatten().fieldErrors as Record<string, string[]>;
}
