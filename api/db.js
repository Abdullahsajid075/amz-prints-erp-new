/**
 * Supabase client — Hostinger "Connect from your Web App" pattern.
 * Set SUPABASE_URL + SUPABASE_API_KEY (service role preferred for server API).
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('[db] Missing SUPABASE_URL or SUPABASE_API_KEY — set them in api/.env');
}

const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = { supabase };
