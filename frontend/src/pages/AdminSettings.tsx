import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Button, Card, Field, Input, Select } from '../components/ui';
import {
  fetchAdminLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  fetchPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  getApiErrorMessage,
} from '../services/admin';
import type { LocationDTO, PricingRuleDTO, VehicleClass } from '../types';

const VEHICLES: { value: VehicleClass; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'executive', label: 'Executive' },
  { value: 'van', label: 'Van' },
];

export default function AdminSettings() {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [rules, setRules] = useState<PricingRuleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState<'city' | 'airport'>('city');

  const [pickupId, setPickupId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [vehicle, setVehicle] = useState<VehicleClass>('standard');
  const [price, setPrice] = useState('');
  const [ruleError, setRuleError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [locs, pricing] = await Promise.all([fetchAdminLocations(), fetchPricingRules()]);
      setLocations(locs);
      setRules(pricing);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load settings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const locationName = (id: number) => locations.find((l) => l.id === id)?.name ?? `#${id}`;

  async function handleAddLocation(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!locName.trim()) return;
    try {
      await createLocation({ name: locName.trim(), type: locType });
      setLocName('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function toggleLocationStatus(loc: LocationDTO) {
    try {
      await updateLocation(loc.id, { status: loc.status === 'active' ? 'inactive' : 'active' });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function removeLocation(loc: LocationDTO) {
    if (!confirm(`Delete location ${loc.name}?`)) return;
    try {
      await deleteLocation(loc.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleAddRule(event: React.FormEvent) {
    event.preventDefault();
    setRuleError('');
    if (!pickupId || !destinationId) {
      setRuleError('Select pickup and destination.');
      return;
    }
    if (pickupId === destinationId) {
      setRuleError('Pickup and destination must differ.');
      return;
    }
    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setRuleError('Enter a valid price.');
      return;
    }
    try {
      await createPricingRule({
        pickup_location_id: Number(pickupId),
        destination_location_id: Number(destinationId),
        vehicle_class: vehicle,
        price: priceNumber,
      });
      setPrice('');
      await load();
    } catch (err) {
      setRuleError(getApiErrorMessage(err));
    }
  }

  async function changePrice(rule: PricingRuleDTO) {
    const next = prompt(`New price for ${locationName(rule.pickup_location_id)} → ${locationName(rule.destination_location_id)} (${rule.vehicle_class})`, String(rule.price));
    if (next === null) return;
    const value = Number(next);
    if (!Number.isFinite(value) || value < 0) return;
    try {
      await updatePricingRule(rule.id, { price: value });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function removeRule(rule: PricingRuleDTO) {
    if (!confirm('Delete this pricing rule?')) return;
    try {
      await deletePricingRule(rule.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Settings</h1>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Locations</h2>
          <form onSubmit={handleAddLocation} className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3" noValidate>
            <Field label="Name" htmlFor="loc-name">
              <Input id="loc-name" value={locName} onChange={(e) => setLocName(e.target.value)} />
            </Field>
            <Field label="Type" htmlFor="loc-type">
              <Select id="loc-type" value={locType} onChange={(e) => setLocType(e.target.value as 'city' | 'airport')}>
                <option value="city">City</option>
                <option value="airport">Airport</option>
              </Select>
            </Field>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Add</Button>
            </div>
          </form>
          <ul className="divide-y divide-slate-100">
            {loading && <li className="py-3 text-center text-slate-400">Loading…</li>}
            {locations.map((loc) => (
              <li key={loc.id} className="flex items-center justify-between py-2.5">
                <div>
                  <span className="font-medium text-slate-900">{loc.name}</span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{loc.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${loc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{loc.status}</span>
                  <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => toggleLocationStatus(loc)}>Toggle</Button>
                  <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => removeLocation(loc)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Pricing rules</h2>
          <form onSubmit={handleAddRule} className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2" noValidate>
            <Field label="Pickup" htmlFor="rule-pickup">
              <Select id="rule-pickup" value={pickupId} onChange={(e) => setPickupId(e.target.value)}>
                <option value="">Select</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="Destination" htmlFor="rule-dest">
              <Select id="rule-dest" value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
                <option value="">Select</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="Vehicle" htmlFor="rule-vehicle">
              <Select id="rule-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value as VehicleClass)}>
                {VEHICLES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </Select>
            </Field>
            <Field label="Price ($)" htmlFor="rule-price">
              <Input id="rule-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full">Add rule</Button>
            </div>
          </form>
          {ruleError && <p role="alert" className="mb-3 text-sm text-red-600">{ruleError}</p>}
          <ul className="divide-y divide-slate-100">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-700">
                  {locationName(r.pickup_location_id)} → {locationName(r.destination_location_id)}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">{r.vehicle_class}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => changePrice(r)} className="font-semibold text-brand-700">${Number(r.price).toFixed(2)}</button>
                  <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => removeRule(r)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
}
