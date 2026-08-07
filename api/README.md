# AMZ ERP API — Hostinger + Supabase (easy path)

```
Vercel frontend (erp.amzprints.com)
    → Hostinger Node API (this folder)
        → Supabase database
```

## 3 steps only

### 1) Supabase (once)
Supabase → SQL Editor → run [`schema.sql`](./schema.sql)  
Login seed: **admin** / **admin123**

### 2) Hostinger Node app
New website / Node app (not on `erp.amzprints.com`):

| Setting | Value |
|--------|--------|
| Root directory | `api` |
| Branch | `main` |
| Node | `18.x` |
| Install | `npm install` |
| Start / file | `npm start` or `server.js` |

**Env vars (copy-paste):**

```env
SUPABASE_URL=https://ovwayrwhcdmcdofavitm.supabase.co
SUPABASE_API_KEY=PASTE_SERVICE_ROLE_KEY
CORS_ORIGINS=https://erp.amzprints.com,http://localhost:5173
PORT=3000
NODE_ENV=production
```

Deploy → copy public URL (e.g. `https://xxxx.hostingersite.com`).

**Test in browser:**
`https://YOUR-HOSTINGER-URL/health`  
Should show: `{"ok":true,"backend":"supabase",...}`

### 3) Vercel frontend
Project → Settings → Environment Variables:

```env
REACT_APP_GAS_API_URL=https://YOUR-HOSTINGER-URL
```

Root Directory = `frontend` → Redeploy.

Done. Open https://erp.amzprints.com and login.

---

## Local (optional)

```bash
cd api
cp .env.example .env
npm install
npm start
```

Frontend `.env`: `REACT_APP_GAS_API_URL=http://localhost:3000`

## CSV import (later)

```bash
cd api
node _lib/scripts/import-csv.js Customers.csv customers
npm run migrate:seed
```
