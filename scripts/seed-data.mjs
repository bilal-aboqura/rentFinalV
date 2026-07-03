/**
 * seed-data.mjs
 * One-off script to populate the LIVE database with a large set of
 * demo/operational data for the admin pages:
 *   - Locations  (cities + airports)
 *   - Drivers    (name, phone, license plate, status)
 *   - Pricing    (route x vehicle-class flat rates)
 *
 * All inserts are idempotent (upsert with ignoreDuplicates on natural keys)
 * so it is safe to run multiple times.
 *
 * Usage: node scripts/seed-data.mjs
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ----------------------------------------------------------------
// Load .env manually (project uses .env, not .env.local)
// ----------------------------------------------------------------
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at project root.');
  process.exit(1);
}
const env = fs.readFileSync(envPath, 'utf-8');
env.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const [key, ...rest] = trimmed.split('=');
  if (key && rest.length) {
    process.env[key.trim()] = rest.join('=').replace(/^["']|["']$/g, '').trim();
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ================================================================
// 1. LOCATIONS — KSA cities and airports
// ================================================================
const LOCATIONS = [
  // Cities
  { name: 'Riyadh', type: 'city', status: 'active' },
  { name: 'Jeddah', type: 'city', status: 'active' },
  { name: 'Makkah', type: 'city', status: 'active' },
  { name: 'Madinah', type: 'city', status: 'active' },
  { name: 'Dammam', type: 'city', status: 'active' },
  { name: 'Al Khobar', type: 'city', status: 'active' },
  { name: 'Abha', type: 'city', status: 'active' },
  { name: 'Taif', type: 'city', status: 'active' },
  { name: 'Tabuk', type: 'city', status: 'active' },
  { name: 'Buraidah', type: 'city', status: 'active' },
  { name: 'Hail', type: 'city', status: 'active' },
  { name: 'Najran', type: 'city', status: 'active' },
  { name: 'Jizan', type: 'city', status: 'active' },
  { name: 'Yanbu', type: 'city', status: 'active' },
  { name: 'Al Ahsa', type: 'city', status: 'active' },
  { name: 'Jubail', type: 'city', status: 'active' },
  { name: 'Khamis Mushait', type: 'city', status: 'active' },
  { name: 'Arar', type: 'city', status: 'active' },
  { name: 'Sakaka', type: 'city', status: 'active' },
  { name: 'Al Baha', type: 'city', status: 'active' },
  // Airports
  { name: 'King Khalid International Airport (RUH)', type: 'airport', status: 'active' },
  { name: 'King Abdulaziz International Airport (JED)', type: 'airport', status: 'active' },
  { name: 'Prince Mohammad bin Abdulaziz Airport (MED)', type: 'airport', status: 'active' },
  { name: 'King Fahd International Airport (DMM)', type: 'airport', status: 'active' },
  { name: 'Abha International Airport (AHB)', type: 'airport', status: 'active' },
  { name: 'Taif International Airport (TIF)', type: 'airport', status: 'active' },
  { name: 'Tabuk Regional Airport (TUU)', type: 'airport', status: 'active' },
  { name: 'Prince Nayef bin Abdulaziz Airport (ELQ)', type: 'airport', status: 'active' },
  { name: 'Hail Regional Airport (HAS)', type: 'airport', status: 'active' },
  { name: 'Najran Airport (EAM)', type: 'airport', status: 'active' },
  { name: 'King Abdullah Airport (GIZ)', type: 'airport', status: 'active' },
  { name: 'Yanbu Airport (YNB)', type: 'airport', status: 'active' },
  { name: 'Al Jouf Airport (AJF)', type: 'airport', status: 'active' },
  { name: 'Al Baha Airport (ABT)', type: 'airport', status: 'active' },
];

// ================================================================
// 2. DRIVERS — Saudi names, KSA phones & plates
// ================================================================
const DRIVER_NAMES = [
  'Ahmed Al-Qahtani', 'Khalid Al-Otaibi', 'Mohammed Al-Harbi', 'Abdullah Al-Dossari',
  'Faisal Al-Subaie', 'Sultan Al-Mutairi', 'Abdulaziz Al-Shehri', 'Bandar Al-Anazi',
  'Turki Al-Ghamdi', 'Nasser Al-Zahrani', 'Saad Al-Balawi', 'Mansour Al-Rashidi',
  'Yousef Al-Juhani', 'Hamad Al-Enazi', 'Tariq Al-Maliki', 'Waleed Al-Amri',
  'Mishaal Al-Baqmi', 'Rayan Al-Hazmi', 'Fares Al-Qarni', 'Bader Al-Sahrani',
  'Omar Al-Khalifa', 'Saleh Al-Daheri', 'Majed Al-Owais', 'Hussain Al-Rifai',
  'Ali Al-Mousa', 'Hassan Al-Bishr', 'Yasser Al-Qahtani', 'Ebrahim Al-Nasser',
  'Ziyad Al-Faris', 'Thamer Al-Suwaid', 'Rakan Al-Otaibi', 'Mazen Al-Ghamdi',
  'Adel Al-Harthy', 'Naif Al-Zuabi', 'Salem Al-Bloushi', 'Jassim Al-Merekhi',
  'Ghanim Al-Dosari', 'Kamal Al-Shammari', 'Anwar Al-Asiri', 'Louai Al-Kurdi',
];

function buildDrivers() {
  return DRIVER_NAMES.map((name, i) => {
    const n = i + 1;
    // Saudi mobile: +966 5X XXX XXXX
    const suffix = String(1000000 + n * 137).slice(-7).padStart(7, '0');
    const phone = `+9665${suffix}`;
    // Plate: prefix + 4-digit number
    const prefix = ['RYD', 'JED', 'DMM', 'MED', 'AHB'][n % 5];
    const plate = `${prefix}-${String(1000 + n).padStart(4, '0')}`;
    const status = n % 7 === 0 ? 'inactive' : 'active';
    return { name, phone, license_plate: plate, status };
  });
}

// ================================================================
// 3. PRICING — routes (airport <-> city) x 3 vehicle classes
// ================================================================
// Mapping of each airport -> the primary city it serves.
const AIRPORT_CITY = [
  ['King Khalid International Airport (RUH)', 'Riyadh'],
  ['King Abdulaziz International Airport (JED)', 'Jeddah'],
  ['Prince Mohammad bin Abdulaziz Airport (MED)', 'Madinah'],
  ['King Fahd International Airport (DMM)', 'Dammam'],
  ['Abha International Airport (AHB)', 'Abha'],
  ['Taif International Airport (TIF)', 'Taif'],
  ['Tabuk Regional Airport (TUU)', 'Tabuk'],
  ['Prince Nayef bin Abdulaziz Airport (ELQ)', 'Buraidah'],
  ['Hail Regional Airport (HAS)', 'Hail'],
  ['Najran Airport (EAM)', 'Najran'],
  ['King Abdullah Airport (GIZ)', 'Jizan'],
  ['Yanbu Airport (YNB)', 'Yanbu'],
  ['Al Jouf Airport (AJF)', 'Sakaka'],
  ['Al Baha Airport (ABT)', 'Al Baha'],
];

// A few high-demand intercity routes.
const INTERCITY_ROUTES = [
  ['Riyadh', 'Dammam'],
  ['Riyadh', 'Makkah'],
  ['Jeddah', 'Makkah'],
  ['Jeddah', 'Madinah'],
  ['Makkah', 'Madinah'],
  ['Dammam', 'Al Khobar'],
  ['Al Khobar', 'Jubail'],
  ['Abha', 'Khamis Mushait'],
];

// Base price by vehicle class (SAR) for an airport<->city hop.
const CLASS_PRICE = { standard: 120, executive: 220, van: 350 };

function buildPricingRules(locationIdByName) {
  const rules = [];
  const addRoute = (pickupName, destName, multiplier = 1) => {
    const pickupId = locationIdByName[pickupName];
    const destId = locationIdByName[destName];
    if (!pickupId || !destId || pickupId === destId) return;
    for (const [vehicleClass, base] of Object.entries(CLASS_PRICE)) {
      rules.push({
        pickup_location_id: pickupId,
        destination_location_id: destId,
        vehicle_class: vehicleClass,
        price: Math.round((base * multiplier) / 5) * 5, // round to nearest 5 SAR
      });
    }
  };

  // Airport <-> city (both directions)
  for (const [airport, city] of AIRPORT_CITY) {
    addRoute(airport, city, 1);
    addRoute(city, airport, 1);
  }

  // Intercity routes (both directions), priced slightly higher
  for (const [a, b] of INTERCITY_ROUTES) {
    addRoute(a, b, 2.5);
    addRoute(b, a, 2.5);
  }

  return rules;
}

// ================================================================
// Runner
// ================================================================
async function main() {
  console.log(`\n🌱 Seeding live database...\n   URL: ${SUPABASE_URL}\n`);

  // ---- Locations ----
  console.log(`📍 Upserting ${LOCATIONS.length} locations...`);
  const { error: locErr } = await supabase
    .from('locations')
    .upsert(LOCATIONS, { onConflict: 'name', ignoreDuplicates: true });
  if (locErr) {
    console.error('❌ Locations upsert failed:', locErr.message);
    process.exit(1);
  }

  const { data: allLocations, error: locFetchErr } = await supabase
    .from('locations')
    .select('id, name, type, status');
  if (locFetchErr || !allLocations) {
    console.error('❌ Failed to fetch locations back:', locFetchErr?.message);
    process.exit(1);
  }
  const locationIdByName = Object.fromEntries(allLocations.map((l) => [l.name, l.id]));
  console.log(`   ✓ Locations now in DB: ${allLocations.length}`);

  // ---- Drivers ----
  const drivers = buildDrivers();
  console.log(`🚗 Upserting ${drivers.length} drivers...`);
  const { error: drvErr } = await supabase
    .from('drivers')
    .upsert(drivers, { onConflict: 'license_plate', ignoreDuplicates: true });
  if (drvErr) {
    console.error('❌ Drivers upsert failed:', drvErr.message);
    process.exit(1);
  }
  const { count: driverCount } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true });
  console.log(`   ✓ Drivers now in DB: ${driverCount}`);

  // ---- Pricing ----
  const pricingRules = buildPricingRules(locationIdByName);
  console.log(`💰 Upserting ${pricingRules.length} pricing rules...`);
  const { error: priceErr } = await supabase
    .from('pricing_rules')
    .upsert(pricingRules, {
      onConflict: 'pickup_location_id,destination_location_id,vehicle_class',
      ignoreDuplicates: true,
    });
  if (priceErr) {
    console.error('❌ Pricing upsert failed:', priceErr.message);
    process.exit(1);
  }
  const { count: priceCount } = await supabase
    .from('pricing_rules')
    .select('*', { count: 'exact', head: true });
  console.log(`   ✓ Pricing rules now in DB: ${priceCount}`);

  console.log('\n✅ Seed complete. The live site is now populated.\n');
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
