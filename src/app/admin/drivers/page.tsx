import type { Metadata } from 'next';
import { fetchDriversAction } from './actions';
import DriversManager from '@/components/drivers-manager';

export const metadata: Metadata = {
  title: 'Drivers — Admin',
  description: 'Manage driver profiles and availability for airport transfers.',
};

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function DriversPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? '';
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const result = await fetchDriversAction({ search, page, pageSize: 10 });
  const paginatedData = result.success ? result.data : { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Drivers</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage driver profiles and availability status for the fleet.
        </p>
      </div>
      <DriversManager
        drivers={paginatedData.data}
        total={paginatedData.total}
        page={paginatedData.page}
        pageSize={paginatedData.pageSize}
        totalPages={paginatedData.totalPages}
        search={search}
      />
    </div>
  );
}
