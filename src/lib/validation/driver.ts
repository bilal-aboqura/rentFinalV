import { z } from 'zod';

export const CreateDriverSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .transform(val => val.trim()),
  phone: z.string()
    .min(10, { message: 'Phone number must be at least 10 characters long' })
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    .transform(val => val.replace(/[^\d+]/g, '')),
  availability_status: z.enum(['Available', 'Busy', 'Inactive'], {
    message: 'Invalid availability status'
  }).default('Available')
});

export const UpdateDriverSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .transform(val => val.trim())
    .optional(),
  phone: z.string()
    .min(10, { message: 'Phone number must be at least 10 characters long' })
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    .transform(val => val.replace(/[^\d+]/g, ''))
    .optional(),
  availability_status: z.enum(['Available', 'Busy', 'Inactive'], {
    message: 'Invalid availability status'
  }).optional()
});
