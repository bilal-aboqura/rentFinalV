/**
 * T009 [US1] / T013 [US2] / T017 [US3] / T020 [US4]
 * Admin Pricing Management Page (React Server Component wrapper).
 *
 * Route: /admin/pricing
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRoutePricesAction } from './actions';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { PricingManager } from '@/components/pricing-manager';
import AdminNavbar from '@/components/admin-navbar';

export const metadata = {
  title: 'Pricing Management | Admin',
  description: 'Manage route pricing rules for the airport transfer booking service.',
};

export default async function AdminPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const pageSize = 10;

  // Fetch pricing rules (paginated)
  const result = await getRoutePricesAction({ page, pageSize });

  // Fetch active locations for the form dropdowns
  const supabase2 = await createServerClient();
  const { data: locationsData } = await supabase2
    .from('locations')
    .select('id, name, type, is_active, created_at')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (!result.success) {
    return (
      <div className="space-y-6">
        <AdminNavbar activeTab="pricing" />
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">Failed to load pricing rules: {result.error}</p>
        </div>
      </div>
    );
  }

  const { prices, total, totalPages } = result.data!;
  const locations = locationsData ?? [];

  return (
    <div className="space-y-6">
      <AdminNavbar activeTab="pricing" />
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
