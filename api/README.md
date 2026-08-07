# AMZ ERP API — Hostinger + Supabase

Replaces Google Apps Script + Google Sheets. The frontend keeps the same `gasClient` / `REACT_APP_GAS_API_URL` contract — only the URL changes.

## 1. Create tables in Supabase (Hostinger)

1. Open **Hostinger → Supabase** (or your Supabase project SQL editor).
2. Paste and run [`schema.sql`](./schema.sql).
3. This creates all ERP tables + default **admin / admin123** and **Walk-in** customer.

## 2. Connect API (as in Hostinger “Connect from your Web App”)

```bash
cd api
npm install
cp .env.example .env
```

Set in `.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_API_KEY=your_service_role_key
PORT=3000
CORS_ORIGINS=https://erp.amzprints.com,http://localhost:5173
```

Use the **service role** key on the server (not the anon key) so RLS does not block ERP writes.

```bash
npm start
```

## 3. Deploy on Hostinger Node.js

1. Upload the `api/` folder (or connect this Git repo).
2. Set startup file: `server.js`
3. Set env vars: `SUPABASE_URL`, `SUPABASE_API_KEY`, `CORS_ORIGINS`, `PORT`
4. Note your public URL, e.g. `https://api.amzprints.com` or `https://your-vps.hostingersite.com`

## 4. Point the ERP frontend

In Vercel / `frontend/.env`:

```env
REACT_APP_GAS_API_URL=https://YOUR-HOSTINGER-API-URL
```

Redeploy the frontend. No module UI changes required.

## 5. Move existing Google Sheets data

1. Open each sheet in Google Sheets → **File → Download → CSV**.
2. Put files in `api/scripts/csv/` (e.g. `Customers.csv`, `Orders.csv`).
3. Import:

```bash
node scripts/import-csv.js Customers.csv customers
node scripts/import-csv.js Users.csv users
node scripts/import-csv.js Products.csv products
node scripts/import-csv.js Orders.csv orders
node scripts/import-csv.js Invoices.csv invoices
node scripts/import-csv.js Employees.csv employees
node scripts/import-csv.js Vendors.csv vendors
node scripts/import-csv.js Expenses.csv expenses
node scripts/import-csv.js Payments.csv payments
```

4. Seed admin if needed: `npm run migrate:seed`

## Sheet → table map

| Google Sheet | Supabase table |
|--------------|----------------|
| Users        | users          |
| Customers    | customers      |
| CrmNotes     | crm_notes     |
| Employees    | employees      |
| Products     | products       |
| Orders (+ quotations/POS) | orders |
| Invoices     | invoices       |
| Vendors      | vendors        |
| Purchases    | purchases      |
| Expenses     | expenses       |
| Payments     | payments       |
| Counters     | counters + tokens |
| Settings     | settings       |

## Verify

```bash
curl "https://YOUR-API-URL/?path=/health"
curl -X POST "https://YOUR-API-URL/?path=/auth/login" -H "Content-Type: text/plain" -d "{\"email\":\"admin\",\"password\":\"admin123\"}"
```

Then log into the ERP with the same credentials.

## Notes

- Google Apps Script can stay deployed as backup until you confirm Supabase.
- Change the default admin password after go-live.
- Token queue / notifications are supported in simplified form; email SMTP can be added later on Hostinger.
