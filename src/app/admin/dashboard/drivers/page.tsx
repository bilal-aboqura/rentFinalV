import type { Metadata } from 'next';
import { getDriversAction } from '@/app/admin/dashboard/actions';
import DriversManager from './drivers-manager';

export const metadata: Metadata = { title: 'Drivers — Admin Dashboard' };

export default async function DriversPage() {
  const driversRes = await getDriversAction();
  const drivers = driversRes.success ? driversRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Drivers</h1>
        <p className="text-slate-400 text-sm mt-1">Manage driver profiles and availability</p>
      </div>
      <DriversManager drivers={drivers} />
    </div>
  );
}
