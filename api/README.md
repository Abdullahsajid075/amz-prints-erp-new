# AMZ ERP API — Supabase + Vercel (replaces Google Sheets)

Frontend (`erp.amzprints.com`) still calls `?path=/orders&token=...`. This Node app stores data in **Supabase**. Google Sheets stay as backup until you switch the frontend URL.

**Staff cutover steps:** see [CUTOVER.md](./CUTOVER.md).

## Local

```bash
cd api
cp env.example .env
npm install
npm start
```

Frontend: `REACT_APP_GAS_API_URL=http://localhost:3000`

Health: `http://localhost:3000/health`

## Copy live data from GAS

```bash
cd api
# .env must have SUPABASE_* and GAS_API_URL + GAS_ADMIN_PASSWORD
npm run migrate:gas
```

Prints a count table. Re-run until counts match. Does not delete Sheets.

## Vercel (recommended, free)

New Vercel project → Root Directory `api` → env `SUPABASE_URL`, `SUPABASE_API_KEY`, `CORS_ORIGINS`.

Then set frontend `REACT_APP_GAS_API_URL` to that project URL and redeploy.

## Hostinger (optional)

Root `api`, start `server.js` / `npm start`, bind already uses `0.0.0.0`.
