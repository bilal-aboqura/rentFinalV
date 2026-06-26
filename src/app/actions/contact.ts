'use server';

import { createClient } from '@/lib/supabase/server';
import { ServerActionResponse } from '@/types';
import { ContactFormSchema } from '@/lib/validation/contact';

export interface SubmitContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Next.js Server Action to validate and persist a customer contact inquiry.
 */
export async function submitContactForm(
  payload: SubmitContactFormPayload
): Promise<ServerActionResponse<{ success: boolean }>> {
  try {
    // 1. Zod Schema Validation
    const parsed = ContactFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const validationErrors: Record<string, string[]> = {};
      Object.entries(errors).forEach(([key, value]) => {
        if (value) validationErrors[key] = value;
      });
      return { success: false, validationErrors };
    }

    const supabase = await createClient();

    // 2. Persist to Database (default status 'Unread' is enforced via DB schema and RLS policies)
    const { error } = await supabase
      .from('contact_inquiries')
      .insert({
        name: payload.name,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
        status: 'Unread',
      })
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: { success: true },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during contact submission.';
    return {
      success: false,
      error: message,
    };
  }
}
