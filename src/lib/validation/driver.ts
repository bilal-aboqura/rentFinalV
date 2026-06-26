import { z } from 'zod';

const DriverNameSchema = z.string()
  .trim()
  .min(2, { message: 'Name must be at least 2 characters long' })
  .max(100, { message: 'Name must not exceed 100 characters' });

const DriverPhoneSchema = z.string()
  .trim()
  .transform(val => val.replace(/[\s()-]/g, ''))
  .pipe(
    z.string()
      .min(10, { message: 'Phone number must be at least 10 characters long' })
      .max(20, { message: 'Phone number must not exceed 20 characters' })
      .regex(/^\+?\d+$/, {
        message: 'Phone number must contain only digits and an optional leading +',
      })
  );

export const CreateDriverSchema = z.object({
  name: DriverNameSchema,
  phone: DriverPhoneSchema,
  availability_status: z.enum(['Available', 'Busy', 'Inactive'], {
    message: 'Invalid availability status'
  }).default('Available')
});

export const UpdateDriverSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  name: DriverNameSchema.optional(),
  phone: DriverPhoneSchema.optional(),
  availability_status: z.enum(['Available', 'Busy', 'Inactive'], {
    message: 'Invalid availability status'
  }).optional()
});
