/**
 * create-admin.mjs
 * Run once to create the admin account in Supabase Auth.
 * Usage: node scripts/create-admin.mjs
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
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
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Admin credentials — change these before running!
const ADMIN_EMAIL = 'admin@airtransfer.com';
const ADMIN_PASSWORD = 'Admin@12345!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdmin() {
  console.log(`\n🔧 Creating admin account...`);
  console.log(`   URL:   ${SUPABASE_URL}`);
  console.log(`   Email: ${ADMIN_EMAIL}\n`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // Skip email confirmation
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('ℹ️  Admin user already exists. Try logging in with:');
    } else {
      console.error('❌ Failed to create admin:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Admin account created successfully!');
    console.log(`   User ID: ${data.user.id}`);
  }

  console.log('\n📋 Login credentials:');
  console.log(`   URL:      http://localhost:3000/admin/login`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('\n⚠️  Change your password after first login!\n');
}

createAdmin();
