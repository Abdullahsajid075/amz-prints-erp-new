# Backend cutover (Sheets → Supabase)

Live ERP today: Google Sheets + Apps Script. After cutover: **same screens**, data in Supabase, API on Vercel (Hobby, free). **Do not delete the Google Sheet.**

## Aapke 6 kaam

1. **Supabase SQL** — SQL Editor → paste and Run all of [`schema.sql`](./schema.sql). Do not drop tables.
2. **Vercel API project (free)** — New project from this GitHub repo.
   - Root Directory: `api`
   - Framework: Other
   - Env:
     - `SUPABASE_URL`
     - `SUPABASE_API_KEY` (service role, server only)
     - `CORS_ORIGINS=https://erp.amzprints.com,https://amzprints.com,http://localhost:5173`
   - Deploy → copy URL (example `https://amz-erp-api.vercel.app`)
   - Browser check: `https://YOUR-API.vercel.app` **or** `https://YOUR-API.vercel.app/health`  
     Should show JSON: `{"ok":true,"backend":"supabase",...}`  
     Empty `/` with no rewrite used to 404 — do not expect the ERP UI on this project.
3. **Copy data** — on your PC, `api/.env` with Supabase keys + live GAS URL + admin password, then:
   ```bash
   cd api
   npm install
   node _lib/scripts/migrate-from-gas.js
   ```
   Script prints a count table. Re-run until GAS and Supabase counts match. Sheet is not deleted.
4. **Pause** new orders 15–30 min (or run the script twice).
5. **Frontend Vercel** (erp.amzprints.com) → Environment Variables:
   ```
   REACT_APP_GAS_API_URL=https://YOUR-API.vercel.app
   ```
   Redeploy. Rollback = set this back to the old Apps Script `/exec` URL.
6. **Check** — login, one old customer, one old invoice, POS, website products.

## Agent / repo pieces

- Schema parity: blocked customers, product galleries, invoice `order_ids`, expense approval
- API routes match the ERP `gasClient` contract (`?path=`)
- `node _lib/scripts/migrate-from-gas.js` upserts by id
- This folder deploys as a Vercel Node app (`index.js` + `vercel.json`)

WordPress (`AMZ_PRINTS_ERP_URL`) must also point at the new API after cutover.
