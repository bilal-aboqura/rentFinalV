'use server';

/**
 * Spec 010 (F-10) — Contact Form Server Action (US1)
 *
 * Validates and persists a public contact form submission to the
 * `contact_inquiries` table with the initial 'Unread' status.
 *
 * Contract: specs/010-contact-inquiries/contracts/server-actions.md
 *
 * Exports:
 * - submitContactForm() — public Server Action (no auth required)
 */

import { createClient } from '@/lib/supabase/server';
import type { ServerActionResponse } from '@/types';
import { ContactFormSchema, formatContactZodErrors } from '@/lib/validation/contact';

export interface SubmitContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Validates the contact form payload and inserts a new inquiry.
 * Per FR-005 / FR-013, no SMTP emails are dispatched — submissions
 * are kept strictly database-logged.
 */
export async function submitContactForm(
  payload: SubmitContactFormPayload
): Promise<ServerActionResponse<{ success: boolean }>> {
  // ── Step 1: Schema validation ──
  const parsed = ContactFormSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed.',
      validationErrors: formatContactZodErrors(parsed.error),
    };
  }

  const { name, email, subject, message } = parsed.data;

  try {
    const supabase = await createClient();

    // ── Step 2: Insert inquiry with initial 'Unread' status ──
    const { error: insertError } = await supabase
      .from('contact_inquiries')
      .insert({ name, email, subject, message, status: 'Unread' })
      .select()
      .single();

    if (insertError) {
      console.error('[submitContactForm] DB insert error:', insertError);
      return {
        success: false,
        error: 'Failed to submit your message. Please try again later.',
      };
    }

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('[submitContactForm] Unexpected error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    };
  }
}
