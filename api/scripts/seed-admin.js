/**
 * Seed / repair default admin user in Supabase.
 * Usage: node scripts/seed-admin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { supabase } = require('../db');

async function main() {
  const username = process.env.DEFAULT_ADMIN_USER || 'admin';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
  const { error } = await supabase.from('users').upsert({
    id: 'user_admin',
    username,
    password,
    name: 'Admin',
    role: 'Super Admin',
    status: 'Active',
    email: username,
  });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  await supabase.from('customers').upsert({
    id: 'cust_walkin',
    name: 'Walk-in',
    phone: '',
    notes: 'Default POS walk-in customer',
    in_crm: false,
    notify_whatsapp: false,
    notify_email: false,
  });
  console.log(`OK — admin/${password} and Walk-in customer ready`);
}

main();
