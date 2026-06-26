'use server';

import { createClient } from '@/lib/supabase/server';
import { ServerActionResponse } from '@/types';
import { UpdateInquiryStatusSchema } from '@/lib/validation/contact';

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'Unread' | 'Read' | 'Resolved';
  created_at: string;
}

interface ContactInquiryRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactInquiry['status'];
  created_at: string;
}

/**
 * Verifies admin authentication session.
 */
async function verifyAdminAuth() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return { supabase, authorized: !!session };
}

/**
 * Server Action to fetch contact inquiries with server-side pagination.
 */
export async function fetchInquiriesAction(input: {
  page: number;
  limit: number;
  statusFilter?: 'Unread' | 'Read' | 'Resolved';
}): Promise<ServerActionResponse<{ inquiries: ContactInquiry[]; totalCount: number }>> {
  const { page, limit, statusFilter } = input;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    const { supabase, authorized } = await verifyAdminAuth();
    if (!authorized) {
      return { success: false, error: 'Unauthorized. Admin session required.' };
    }

    let query = supabase
      .from('contact_inquiries')
      .select('*', { count: 'exact' });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      return { success: false, error: error.message };
    }

    const inquiries: ContactInquiry[] = ((data as ContactInquiryRow[] | null) || []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      subject: String(row.subject),
      message: String(row.message),
      status: row.status as ContactInquiry['status'],
      created_at: String(row.created_at),
    }));

    return {
      success: true,
      data: {
        inquiries,
        totalCount: count || 0,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action to update the status of a contact inquiry.
 */
export async function updateInquiryStatusAction(
  input: unknown
): Promise<ServerActionResponse<ContactInquiry>> {
  const validation = UpdateInquiryStatusSchema.safeParse(input);
  if (!validation.success) {
    const validationErrors: { [key: string]: string[] } = {};
    validation.error.issues.forEach(issue => {
      const path = issue.path[0] as string;
      if (!validationErrors[path]) {
        validationErrors[path] = [];
      }
      validationErrors[path].push(issue.message);
    });
    return { success: false, validationErrors };
  }

  const { inquiryId, status } = validation.data;

  try {
    const { supabase, authorized } = await verifyAdminAuth();
    if (!authorized) {
      return { success: false, error: 'Unauthorized. Admin session required.' };
    }

    const { data, error } = await supabase
      .from('contact_inquiries')
      .update({ status })
      .eq('id', inquiryId)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const row = data as {
      id: string;
      name: string;
      email: string;
      subject: string;
      message: string;
      status: ContactInquiry['status'];
      created_at: string;
    };
    const inquiry: ContactInquiry = {
      id: row.id,
      name: row.name,
      email: row.email,
      subject: row.subject,
      message: row.message,
      status: row.status,
      created_at: row.created_at,
    };

    return {
      success: true,
      data: inquiry,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action to get the count of Unread contact inquiries.
 */
export async function getUnreadInquiriesCount(): Promise<ServerActionResponse<{ count: number }>> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('contact_inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Unread');

    if (error) {
      return { success: false, error: `Failed to retrieve unread inquiries count: ${error.message}` };
    }

    return {
      success: true,
      data: { count: count || 0 },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return { success: false, error: errorMsg };
  }
}
