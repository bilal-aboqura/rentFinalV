'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Location, PricingRule } from '@/types';
import {
  createLocationAction,
  updateLocationAction,
  createPricingRuleAction,
  deletePricingRuleAction,
} from '@/app/admin/dashboard/actions';
import { Plus, Trash2, MapPin, DollarSign, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  locations: Location[];
  pricingRules: PricingRule[];
}

export default function SettingsManager({ locations, pricingRules }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Location form
  const [locForm, setLocForm] = useState({ name: '', type: 'city' as 'city' | 'airport' });
  const [locErrors, setLocErrors] = useState<Record<string, string>>({});

  // Pricing form
  const [priceForm, setPriceForm] = useState({
    pickupLocationId: '',
    destinationLocationId: '',
    vehicleClass: 'standard' as 'standard' | 'executive' | 'van',
    price: '',
  });
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({});

  const notify = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddLocation = () => {
    setError('');
    setLocErrors({});
    startTransition(async () => {
      const result = await createLocationAction(locForm);
      if (result.success) {
        setLocForm({ name: '', type: 'city' });
        notify('تمت إضافة الموقع.');
        router.refresh();
      } else {
        if (result.validationErrors) {
          const errs: Record<string, string> = {};
          Object.entries(result.validationErrors).forEach(([k, msgs]) => { errs[k] = msgs[0]; });
          setLocErrors(errs);
        } else setError(result.error);
      }
    });
  };

  const handleToggleLocationStatus = (loc: Location) => {
    startTransition(async () => {
      await updateLocationAction({
        id: loc.id,
        status: loc.status === 'active' ? 'inactive' : 'active',
      });
      router.refresh();
    });
  };

  const handleAddPricingRule = () => {
    setError('');
    setPriceErrors({});
    startTransition(async () => {
      const result = await createPricingRuleAction({
        ...priceForm,
        price: Number(priceForm.price),
      });
      if (result.success) {
        setPriceForm({ pickupLocationId: '', destinationLocationId: '', vehicleClass: 'standard', price: '' });
        notify('تمت إضافة قاعدة التسعير.');
        router.refresh();
      } else {
        if (result.validationErrors) {
          const errs: Record<string, string> = {};
          Object.entries(result.validationErrors).forEach(([k, msgs]) => { errs[k] = msgs[0]; });
          setPriceErrors(errs);
        } else setError(result.error);
      }
    });
  };

  const handleDeleteRule = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف قاعدة التسعير؟')) return;
    startTransition(async () => {
      const result = await deletePricingRuleAction(id);
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4" />{success}
        </div>
      )}

      {/* Locations Section */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-900">المواقع</h2>
        </div>

        {/* Add location form */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              id="location-name-input"
              type="text"
              placeholder="اسم الموقع"
              value={locForm.name}
              onChange={(e) => setLocForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/60 border border-slate-700 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
            {locErrors.name && <p className="text-red-400 text-xs mt-1">{locErrors.name}</p>}
          </div>
          <div className="flex gap-2">
            <select
              id="location-type-select"
              value={locForm.type}
              onChange={(e) => setLocForm((p) => ({ ...p, type: e.target.value as 'city' | 'airport' }))}
              className="flex-1 bg-white/60 border border-slate-700 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="city">مدينة</option>
              <option value="airport">مطار</option>
            </select>
            <button
              id="add-location-btn"
              onClick={handleAddLocation}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة
            </button>
          </div>
        </div>

        {/* Locations list */}
        <div className="space-y-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/40 border border-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-900 font-medium">{loc.name}</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {loc.type === 'city' ? 'مدينة' : 'مطار'}
                </span>
              </div>
              <button
                id={`toggle-location-${loc.id}`}
                onClick={() => handleToggleLocationStatus(loc)}
                disabled={isPending}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                  loc.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-slate-100 text-slate-500 border-slate-600 hover:bg-slate-600'
                }`}
              >
                {loc.status === 'active' ? 'نشط' : 'غير نشط'}
              </button>
            </div>
          ))}
          {locations.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">لا توجد مواقع بعد.</p>
          )}
        </div>
      </div>

      {/* Pricing Rules Section */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-900">قواعد التسعير الثابت</h2>
        </div>

        {/* Add pricing rule form */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            id="pricing-pickup-select"
            value={priceForm.pickupLocationId}
            onChange={(e) => setPriceForm((p) => ({ ...p, pickupLocationId: e.target.value }))}
            className="bg-white/60 border border-slate-700 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">نقطة الانطلاق...</option>
            {locations.filter((l) => l.status === 'active').map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <select
            id="pricing-dest-select"
            value={priceForm.destinationLocationId}
            onChange={(e) => setPriceForm((p) => ({ ...p, destinationLocationId: e.target.value }))}
            className="bg-white/60 border border-slate-700 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">الوجهة...</option>
            {locations
              .filter((l) => l.status === 'active' && l.id !== priceForm.pickupLocationId)
              .map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
          </select>
          <select
            id="pricing-vehicle-select"
            value={priceForm.vehicleClass}
            onChange={(e) => setPriceForm((p) => ({ ...p, vehicleClass: e.target.value as never }))}
            className="bg-white/60 border border-slate-700 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="standard">عادية</option>
            <option value="executive">تنفيذية</option>
            <option value="van">فان</option>
          </select>
          <div>
            <input
              id="pricing-price-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="السعر ($)"
              value={priceForm.price}
              onChange={(e) => setPriceForm((p) => ({ ...p, price: e.target.value }))}
              className="w-full bg-white/60 border border-slate-700 text-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
            />
            {priceErrors.price && <p className="text-red-400 text-xs mt-1">{priceErrors.price}</p>}
          </div>
          <button
            id="add-pricing-rule-btn"
            onClick={handleAddPricingRule}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة القاعدة
          </button>
        </div>

        {/* Pricing rules table */}
        <div className="overflow-x-auto">
          {pricingRules.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">لا توجد قواعد تسعير بعد.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-black/10">
                <tr className="text-right text-slate-500">
                  <th className="pb-3 font-medium">الانطلاق</th>
                  <th className="pb-3 font-medium">الوجهة</th>
                  <th className="pb-3 font-medium">الفئة</th>
                  <th className="pb-3 font-medium">السعر</th>
                  <th className="pb-3 font-medium">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {pricingRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-black/5 hover:bg-white/2 transition-colors">
                    <td className="py-3 text-slate-700">
                      {(rule.pickup_location as { name?: string } | null)?.name ??
                        rule.pickup_location_id}
                    </td>
                    <td className="py-3 text-slate-700">
                      {(rule.destination_location as { name?: string } | null)?.name ??
                        rule.destination_location_id}
                    </td>
                    <td className="py-3 text-slate-700">
                      {rule.vehicle_class === 'standard'
                        ? 'عادية'
                        : rule.vehicle_class === 'executive'
                          ? 'تنفيذية'
                          : 'فان'}
                    </td>
                    <td className="py-3 font-semibold text-emerald-400" dir="ltr">
                      ${rule.price}
                    </td>
                    <td className="py-3">
                      <button
                        id={`delete-rule-${rule.id}`}
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
