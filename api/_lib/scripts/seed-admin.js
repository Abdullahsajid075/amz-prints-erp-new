/**
 * Seed / repair default admin user in Supabase.
 * Usage: node scripts/seed-admin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
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

  const catalog = [
    { id: 'prod_visiting_cards', name: 'Visiting Cards', category: 'Stationery', rate: 800, unit: 'per box', description: 'Standard visiting cards, 300gsm, matte or gloss.', status: 'Active', product_type: 'Product', min_quantity: 1, material: 'Art card 300gsm', size: '90 x 54 mm' },
    { id: 'prod_letterhead', name: 'Letterhead Pad', category: 'Stationery', rate: 1500, unit: 'per pad', description: 'A4 letterheads, 100 sheets.', status: 'Active', product_type: 'Product', min_quantity: 1, material: 'Offset 100gsm', size: 'A4' },
    { id: 'prod_flyer_a5', name: 'A5 Flyers', category: 'Marketing', rate: 2500, unit: 'per 500', description: 'Full colour A5 flyers, double sided.', status: 'Active', product_type: 'Product', min_quantity: 1, material: 'Art paper 128gsm', size: 'A5' },
    { id: 'prod_banner', name: 'Flex Banner', category: 'Outdoor', rate: 4500, unit: 'per piece', description: 'Outdoor flex banner with eyelets.', status: 'Active', product_type: 'Product', min_quantity: 1, material: 'Flex', size: '3 x 6 ft' },
    { id: 'prod_mug', name: 'Custom Mug', category: 'Gifts', rate: 650, unit: 'per piece', description: 'White ceramic mug with print.', status: 'Active', product_type: 'Product', min_quantity: 1, material: 'Ceramic', size: '11 oz' },
  ];
  for (const p of catalog) {
    const { error: pErr } = await supabase.from('products').upsert(p);
    if (pErr) console.error('product seed', p.id, pErr.message);
  }

  console.log(`OK — admin/${password}, Walk-in customer, and ${catalog.length} catalog products ready`);
}

main();
