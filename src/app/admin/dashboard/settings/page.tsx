import type { Metadata } from 'next';
import { getLocationsAction, getPricingRulesAction } from '@/app/admin/dashboard/actions';
import SettingsManager from './settings-manager';

export const metadata: Metadata = { title: 'الإعدادات - لوحة التحكم' };

export default async function SettingsPage() {
  const [locationsRes, pricingRes] = await Promise.all([
    getLocationsAction(),
    getPricingRulesAction(),
  ]);

  const locations = locationsRes.success ? locationsRes.data : [];
  const pricingRules = pricingRes.success ? pricingRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الإعدادات</h1>
        <p className="mt-1 text-sm text-slate-500">إدارة المدن والمطارات وقواعد التسعير الثابتة</p>
      </div>
      <SettingsManager locations={locations} pricingRules={pricingRules} />
    </div>
  );
}
