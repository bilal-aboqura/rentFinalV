/**
 * T004 — Contact Form Zod Validation Schemas & Types
 *
 * Validation rules for the public contact form (US1) and the admin
 * inquiry status update (US3).
 *
 * Spec: specs/010-contact-inquiries/contracts/server-actions.md
 *       specs/010-contact-inquiries/data-model.md
 */

import { z } from 'zod';
import type { ServerActionResponse } from '@/types';

// ─────────────────────────────────────────────────────────────
// Status constants
// ─────────────────────────────────────────────────────────────

/** Inquiry lifecycle statuses managed from the admin dashboard. */
export const INQUIRY_STATUSES = ['Unread', 'Read', 'Resolved'] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

// ─────────────────────────────────────────────────────────────
// Public contact form schema (US1)
// ─────────────────────────────────────────────────────────────

/**
 * Zod schema for the public contact form submission.
 *
 * Length boundaries mirror the database column constraints
 * documented in data-model.md (Spec 010).
 */
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

export type SubmitContactFormPayload = z.infer<typeof ContactFormSchema>;

// ─────────────────────────────────────────────────────────────
// Admin status update schema (US3)
// ─────────────────────────────────────────────────────────────

/**
 * Zod schema for validating an inquiry status update payload.
 * Used by `updateInquiryStatusAction` (US3).
 */
export const UpdateInquiryStatusSchema = z.object({
  inquiryId: z.string().uuid({ message: 'Invalid inquiry ID.' }),
  status: z.enum(INQUIRY_STATUSES, {
    errorMap: () => ({ message: 'Invalid status selection.' }),
  }),
});

export type UpdateInquiryStatusInput = z.infer<typeof UpdateInquiryStatusSchema>;

/** Flattens a Zod error into a `Record<string, string[]>` for action responses. */
export function formatContactZodErrors(
  error: z.ZodError
): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

// ─────────────────────────────────────────────────────────────
// Application interface — row shape
// ─────────────────────────────────────────────────────────────

/**
 * A contact_inquiries row, matching the Supabase table schema.
 * Co-located here (per the sibling validation-file convention).
 */
export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

// Re-export the canonical response type so action consumers can
// import everything they need from a single feature module.
export type { ServerActionResponse };
