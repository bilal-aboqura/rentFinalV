import { z } from 'zod';

export const LocationTypeSchema = z.enum(['City', 'Airport', 'Pickup Point']);

export const CreateLocationSchema = z.object({
  name: z.string()
    .min(2, { message: 'Location name must be at least 2 characters long' })
    .max(100, { message: 'Location name cannot exceed 100 characters' })
    .trim(),
  type: LocationTypeSchema,
  isActive: z.boolean().default(true),
});

export const UpdateLocationSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  name: z.string()
    .min(2, { message: 'Location name must be at least 2 characters long' })
    .max(100, { message: 'Location name cannot exceed 100 characters' })
    .trim()
    .optional(),
  type: LocationTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

export const LocationIdSchema = z.string().uuid({ message: 'Invalid ID format' });
