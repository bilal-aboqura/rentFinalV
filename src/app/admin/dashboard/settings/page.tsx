import type { Metadata } from 'next';
import { getLocationsAction, getPricingRulesAction } from '@/app/admin/dashboard/actions';
import SettingsManager from './settings-manager';

export const metadata: Metadata = { title: 'Settings — Admin Dashboard' };

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
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage cities, airports, and flat-rate pricing rules</p>
      </div>
      <SettingsManager locations={locations} pricingRules={pricingRules} />
    </div>
  );
}
