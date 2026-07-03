import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InquiriesManager from '@/components/inquiries-manager';
import AdminShell from '@/components/admin-shell';
import { fetchInquiriesAction } from './actions';

export const metadata: Metadata = {
  title: 'الاستفسارات - لوحة التحكم',
};

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function InquiriesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/admin/login');
  }

  const params = await searchParams;
  const requestedPage = Number(params.page ?? 1);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const inquiriesRes = await fetchInquiriesAction({ page, limit: PAGE_SIZE });

  const inquiries = inquiriesRes.success ? inquiriesRes.data.inquiries : [];
  const totalCount = inquiriesRes.success ? inquiriesRes.data.totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <AdminShell userEmail={user.email}>
      <div className="mx-auto max-w-6xl text-slate-900">
        <div className="space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">الاستفسارات</h1>
              <p className="mt-1 text-sm text-slate-500">اقرأ رسائل العملاء وتابعها من مكان واحد</p>
            </div>
          </header>

          <InquiriesManager
            inquiries={inquiries}
            totalCount={totalCount}
            page={page}
            totalPages={totalPages}
          />
        </div>
      </div>
    </AdminShell>
  );
}
