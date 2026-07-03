import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLocationsData } from './data';
import { LocationsManager } from '@/components/locations-manager';

interface LocationsPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export const metadata = {
  title: 'إدارة المواقع | لوحة التحكم',
  description: 'إدارة المدن والمطارات ونقاط الانطلاق لخدمة الحجز.',
};

export default async function AdminLocationsPage({ searchParams }: LocationsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const params = await searchParams;
  const search = params.search ?? '';
  const page = parseInt(params.page ?? '1', 10);
  const pageSize = 10;

  const result = await getLocationsData({ search, page, pageSize });

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">تعذر تحميل المواقع: {result.error}</p>
        </div>
      </div>
    );
  }

  const { locations, total, totalPages } = result.data;

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="text-sm text-slate-500">جارٍ التحميل...</div>}>
        <LocationsManager
          initialLocations={locations}
          initialTotal={total}
          initialPage={page}
          initialPageSize={pageSize}
          initialTotalPages={totalPages}
          initialSearch={search}
        />
      </Suspense>
    </div>
  );
}
