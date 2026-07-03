import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRoutePricesAction } from './actions';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { PricingManager } from '@/components/pricing-manager';

export const metadata = {
  title: 'إدارة الأسعار | لوحة التحكم',
  description: 'إدارة أسعار المسارات لخدمة النقل من وإلى المطار.',
};

export default async function AdminPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const pageSize = 10;

  const result = await getRoutePricesAction({ page, pageSize });

  const supabase2 = await createServerClient();
  const { data: locationsData } = await supabase2
    .from('locations')
    .select('id, name, type, status, created_at')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">تعذر تحميل قواعد التسعير: {result.error}</p>
        </div>
      </div>
    );
  }

  const { prices, total, totalPages } = result.data!;
  const locations = locationsData ?? [];

  return (
    <div className="space-y-6">
      <PricingManager
        initialPrices={prices}
        initialTotal={total}
        initialPage={page}
        initialPageSize={pageSize}
        initialTotalPages={totalPages}
        locations={locations}
      />
    </div>
  );
}
