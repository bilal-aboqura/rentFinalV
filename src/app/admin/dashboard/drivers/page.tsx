import type { Metadata } from 'next';
import { getDriversAction } from '@/app/admin/dashboard/actions';
import DriversManager from './drivers-manager';

export const metadata: Metadata = { title: 'السائقون - لوحة التحكم' };

export default async function DriversPage() {
  const driversRes = await getDriversAction();
  const drivers = driversRes.success ? driversRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">السائقون</h1>
        <p className="mt-1 text-sm text-slate-500">إدارة ملفات السائقين وحالة توفرهم</p>
      </div>
      <DriversManager drivers={drivers} />
    </div>
  );
}
