/**
 * Supabase client — Hostinger / Supabase project.
 * Prefers service-role key so ERP server can read/write all tables.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_API_KEY
  || process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SECRET_KEY
  || process.env.sb_secret;

if (!url || !key) {
  console.warn('[db] Missing SUPABASE_URL or SUPABASE_API_KEY — set them in api/.env');
}

const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = { supabase };
