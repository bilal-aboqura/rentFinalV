import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InquiriesManager from '@/components/inquiries-manager';
import AdminNavbar from '@/components/admin-navbar';
import { fetchInquiriesAction } from './actions';

export const metadata: Metadata = {
  title: 'Inquiries — Admin',
};

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function InquiriesPage({ searchParams }: PageProps) {
  // Gate: require an authenticated admin session (mirrors other admin pages).
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
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <AdminNavbar activeTab="inquiries" />
        <div className="space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">Inquiries</h1>
              <p className="text-slate-400 text-sm mt-1">
                Read and manage customer contact messages
              </p>
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
    </div>
  );
}
