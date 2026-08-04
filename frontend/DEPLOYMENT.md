# AMZ Prints ERP — Deployment Guide (Vercel)

The frontend is a Vite + React app that talks directly to a Google Apps Script (GAS) Web App backed by Google Sheets and Google Drive. The backend is **not** hosted on Vercel.

## Deploy to Vercel

1. Push this repo to GitHub / GitLab / Bitbucket.
2. In Vercel → **Add New Project** → import the repo.
3. Set **Root Directory** to `frontend`.
4. Vercel settings (also in `frontend/vercel.json`):
   - Framework: Vite
   - Build: `npm run build`
   - Output: `dist`
5. Environment variable (optional if using `vercel.json` build env):

   | Key | Value |
   | --- | --- |
   | `REACT_APP_GAS_API_URL` | `https://script.google.com/macros/s/…/exec` |

6. Click **Deploy**.

## Local Development

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Login uses credentials from the **Users** sheet in your Google Spreadsheet (connected via GAS `SPREADSHEET_ID`).

## Google Apps Script API Contract

The GAS Web App must expose these JSON endpoints via `?path=` query routing:

- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET /dashboard/stats`, `GET /dashboard/charts`, `GET /dashboard/recent-orders`
- CRUD for `/orders`, `/customers`, `/products`, `/designers`, `/vendors`, `/purchases`, `/invoices`, `/expenses`
- `GET /public/invoice/:token` (public share)
- `GET /settings`, `PUT /settings`
- `GET /reports?period=…`

Auth token is passed as `?token=` (GAS web apps do not receive `Authorization` headers reliably).

## Files of Interest

- `frontend/vercel.json` — build env + SPA rewrites
- `frontend/.env.example` — env template
- `frontend/src/services/gasClient.js` — GAS fetch client
- `frontend/src/services/api.js` — API modules
- `gas/Code.gs` — Apps Script backend source
