import { z } from 'zod';

export const ContactFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Full name is required.' })
    .max(100, { message: 'Full name cannot exceed 100 characters.' }),
  email: z
    .string()
    .min(1, { message: 'Email address is required.' })
    .email({ message: 'Please enter a valid email address.' }),
  subject: z
    .string()
    .min(1, { message: 'Subject is required.' })
    .max(150, { message: 'Subject cannot exceed 150 characters.' }),
  message: z
    .string()
    .min(1, { message: 'Message is required.' })
    .max(3000, { message: 'Message cannot exceed 3000 characters.' }),
});

export const UpdateInquiryStatusSchema = z.object({
  inquiryId: z.string().uuid({ message: 'Invalid inquiry ID.' }),
  status: z.enum(['Unread', 'Read', 'Resolved'], {
    message: 'Invalid status selection.',
  }),
});
