import { useEffect, useState } from 'react';
import { Trash2, RefreshCw, MapPin, DollarSign } from 'lucide-react';
import {
  fetchAdminLocations,
  createLocation,
  deleteLocation,
  fetchPricingRules,
  createPricingRule,
  deletePricingRule,
  type AdminLocation,
  type PricingRule,
} from '../services/adminSettings';
import type { VehicleClass } from '../services/types';

export function AdminSettingsPage() {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [locForm, setLocForm] = useState({ name: '', type: 'city' as 'city' | 'airport' });
  const [ruleForm, setRuleForm] = useState({
    pickup_location_id: '',
    destination_location_id: '',
    vehicle_class: 'standard' as VehicleClass,
    price: '',
  });
  const [savingLoc, setSavingLoc] = useState(false);
  const [savingRule, setSavingRule] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [locs, rls] = await Promise.all([fetchAdminLocations(), fetchPricingRules()]);
      setLocations(locs);
      setRules(rls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    if (savingLoc) return;
    setSavingLoc(true);
    setError(null);
    try {
      await createLocation({ name: locForm.name, type: locForm.type });
      setLocForm({ name: '', type: locForm.type });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add location.');
    } finally {
      setSavingLoc(false);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (savingRule) return;
    setSavingRule(true);
    setError(null);
    try {
      await createPricingRule({
        pickup_location_id: Number(ruleForm.pickup_location_id),
        destination_location_id: Number(ruleForm.destination_location_id),
        vehicle_class: ruleForm.vehicle_class,
        price: Number(ruleForm.price),
      });
      setRuleForm({
        pickup_location_id: '',
        destination_location_id: '',
        vehicle_class: 'standard',
        price: '',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add pricing rule.');
    } finally {
      setSavingRule(false);
    }
  }

  async function removeLocation(loc: AdminLocation) {
    if (!confirm(`Delete location "${loc.name}"?`)) return;
    try {
      await deleteLocation(loc.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location.');
    }
  }

  async function removeRule(rule: PricingRule) {
    if (!confirm('Delete this pricing rule?')) return;
    try {
      await deletePricingRule(rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule.');
    }
  }

  function locationName(id: number): string {
    return locations.find((l) => l.id === id)?.name ?? `#${id}`;
  }

  if (loading) {
    return <div className="py-8 text-center text-slate-500">Loading settings…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <button
          onClick={load}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* Locations */}
      <section className="rounded-xl bg-white p-5 shadow ring-1 ring-slate-200">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <MapPin className="h-5 w-5 text-brand-600" /> Locations
        </h2>
        <form onSubmit={handleAddLocation} className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            placeholder="Location name"
            required
            value={locForm.name}
            onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
          />
          <select
            value={locForm.type}
            onChange={(e) => setLocForm({ ...locForm, type: e.target.value as 'city' | 'airport' })}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="city">City</option>
            <option value="airport">Airport</option>
          </select>
          <button
            type="submit"
            disabled={savingLoc}
            className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {savingLoc ? 'Adding…' : 'Add Location'}
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => (
            <span
              key={loc.id}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-2 text-sm text-slate-700"
            >
              <span className="text-xs uppercase text-slate-400">{loc.type}</span>
              {loc.name}
              <button
                onClick={() => removeLocation(loc)}
                className="rounded-full p-1 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {locations.length === 0 && (
            <p className="text-sm text-slate-500">No locations configured.</p>
          )}
        </div>
      </section>

      {/* Pricing Rules */}
      <section className="rounded-xl bg-white p-5 shadow ring-1 ring-slate-200">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <DollarSign className="h-5 w-5 text-brand-600" /> Pricing Rules
        </h2>
        <form
          onSubmit={handleAddRule}
          className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-5"
        >
          <select
            required
            value={ruleForm.pickup_location_id}
            onChange={(e) => setRuleForm({ ...ruleForm, pickup_location_id: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Pickup</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select
            required
            value={ruleForm.destination_location_id}
            onChange={(e) =>
              setRuleForm({ ...ruleForm, destination_location_id: e.target.value })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Destination</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select
            value={ruleForm.vehicle_class}
            onChange={(e) =>
              setRuleForm({ ...ruleForm, vehicle_class: e.target.value as VehicleClass })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="standard">Standard</option>
            <option value="executive">Executive</option>
            <option value="van">Van</option>
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Price"
            required
            value={ruleForm.price}
            onChange={(e) => setRuleForm({ ...ruleForm, price: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            type="submit"
            disabled={savingRule}
            className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {savingRule ? 'Adding…' : 'Add Rule'}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">Pickup</th>
                <th className="px-2 py-2">Destination</th>
                <th className="px-2 py-2">Vehicle</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((r) => (
                <tr key={r.id}>
                  <td className="px-2 py-2 text-slate-700">
                    {r.pickupLocation?.name ?? locationName(r.pickup_location_id)}
                  </td>
                  <td className="px-2 py-2 text-slate-700">
                    {r.destinationLocation?.name ?? locationName(r.destination_location_id)}
                  </td>
                  <td className="px-2 py-2 capitalize text-slate-600">{r.vehicle_class}</td>
                  <td className="px-2 py-2 text-slate-600">${Number(r.price).toFixed(2)}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => removeRule(r)}
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-slate-500">
                    No pricing rules configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
