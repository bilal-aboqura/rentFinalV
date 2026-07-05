'use server';

import { createClient } from '@/lib/supabase/server';
import { getActiveCarsAction } from '@/app/actions/cars';
import type { CarPriceQuote, ServerActionResponse, VehicleClass } from '@/types';

interface PricingRuleRow {
  vehicle_class: VehicleClass;
  price: number;
}

/**
 * Returns price quotes for every active car on the given route.
 *
 * Pricing lives in `pricing_rules` keyed on
 * (pickup_location_id, destination_location_id, vehicle_class).
 * Each car maps to a vehicle_class, so we fetch the rule per class
 * for this route and merge it onto the car list.
 *
 * Cars with no configured price for the route are returned with
 * `available: false` and `price: 0` so the UI can either hide them
 * or show a "contact us" message rather than breaking the flow.
 */
export async function getRouteCarPricingAction(
  pickupLocationId: string,
  destinationLocationId: string,
): Promise<ServerActionResponse<CarPriceQuote[]>> {
  if (pickupLocationId === destinationLocationId) {
    return { success: false, error: 'Pickup and destination must be different.' };
  }

  try {
    const supabase = await createClient();
    const cars = await getActiveCarsAction();

    if (cars.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .select('vehicle_class, price')
      .eq('pickup_location_id', pickupLocationId)
      .eq('destination_location_id', destinationLocationId);

    if (error) {
      return { success: false, error: 'Failed to retrieve route pricing.' };
    }

    const priceByClass = new Map<VehicleClass, number>();
    for (const row of (data ?? []) as PricingRuleRow[]) {
      // First match wins; pricing_rules has a UNIQUE constraint on
      // (pickup, destination, vehicle_class) so duplicates are impossible.
      if (!priceByClass.has(row.vehicle_class)) {
        priceByClass.set(row.vehicle_class, Number(row.price));
      }
    }

    const quotes: CarPriceQuote[] = cars.map((car) => {
      const price = priceByClass.get(car.vehicle_class);
      return {
        car,
        vehicle_class: car.vehicle_class,
        price: price ?? 0,
        available: typeof price === 'number',
      };
    });

    return { success: true, data: quotes };
  } catch {
    return { success: false, error: 'Failed to retrieve route pricing.' };
  }
}

/**
 * Server-side price verification used at booking-submit time to
 * prevent tampering. Returns the unit price for a single car/class,
 * or null when no pricing exists for the route.
 */
export async function verifyRoutePriceAction(
  pickupLocationId: string,
  destinationLocationId: string,
  vehicleClass: VehicleClass,
): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('price')
    .eq('pickup_location_id', pickupLocationId)
    .eq('destination_location_id', destinationLocationId)
    .eq('vehicle_class', vehicleClass)
    .maybeSingle();

  if (error || !data) return null;
  return Number(data.price);
}
