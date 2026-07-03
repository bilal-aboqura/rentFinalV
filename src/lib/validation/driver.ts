import { z } from 'zod';

export const DriverStatusSchema = z.enum(['active', 'inactive']);
export type DriverStatus = z.infer<typeof DriverStatusSchema>;

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
    .transform((val) => val.replace(/[^\d+]/g, '')),
  licensePlate: z
    .string()
    .min(2, { message: 'License plate must be at least 2 characters long' })
    .max(30, { message: 'License plate must not exceed 30 characters' })
    .transform((val) => val.trim().toUpperCase()),
  status: DriverStatusSchema.default('active'),
});

export type CreateDriverInput = z.infer<typeof CreateDriverSchema>;

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
  licensePlate: z
    .string()
    .min(2, { message: 'License plate must be at least 2 characters long' })
    .max(30, { message: 'License plate must not exceed 30 characters' })
    .transform((val) => val.trim().toUpperCase())
    .optional(),
  status: DriverStatusSchema.optional(),
});

export type UpdateDriverInput = z.infer<typeof UpdateDriverSchema>;

export interface DriverRecord {
  id: string;
  name: string;
  phone: string;
  license_plate: string;
  status: DriverStatus;
  created_at: string;
}

export type DriverActionResponse<T> =
  | { success: true; data: T }
  | { success: false; validationErrors?: Record<string, string[]>; error?: string };

export function formatDriverZodErrors(errors: z.ZodError): Record<string, string[]> {
  return errors.flatten().fieldErrors as Record<string, string[]>;
}
