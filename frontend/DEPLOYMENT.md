# AMZ Prints ERP — Deployment Guide (Vercel)

The frontend is a React (CRA + craco) app that talks directly to a Google Apps Script (GAS) Web App backed by Google Sheets and Google Drive. The backend is **not** hosted on Vercel.

## Deploy to Vercel

1. Push this repo to GitHub / GitLab / Bitbucket.
2. In Vercel → **Add New Project** → import the repo.
3. Set **Root Directory** to `frontend`.
4. Vercel will auto-detect the settings from `frontend/vercel.json`:
   - Framework: Create React App
   - Install: `yarn install --frozen-lockfile`
   - Build: `yarn build`
   - Output: `build`
5. Add environment variables (Project → Settings → Environment Variables):

   | Key | Value | Notes |
   | --- | --- | --- |
   | `REACT_APP_GAS_API_URL` | `https://script.google.com/macros/s/…/exec` | Your deployed Apps Script Web App URL |
   | `REACT_APP_DEMO_PASSWORD` | *(leave unset in prod)* | Mock only |
   | `REACT_APP_DEMO_TOKEN` | *(leave unset in prod)* | Mock only |

6. Click **Deploy**.

## Local Development

```bash
cd frontend
cp .env.example .env
# edit .env — set REACT_APP_GAS_API_URL or leave empty for mock mode
yarn install
yarn start
```

## Switching from Mock → Real Backend
Only one action is required after deployment: set `REACT_APP_GAS_API_URL` in Vercel → **Redeploy**. No code changes needed.

## Google Apps Script API Contract
The GAS Web App must expose the following JSON endpoints (all prefixed after the base URL):

- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET /dashboard/stats`, `GET /dashboard/charts`, `GET /dashboard/recent-orders`
- CRUD for `/orders`, `/customers`, `/products`, `/designers`, `/vendors`, `/purchases`, `/invoices`, `/expenses`
- `GET /public/invoice/:token` (public share)
- `GET /settings`, `PUT /settings`
- `GET /reports?period=…`
- File upload: `POST /files/upload` (multipart) → returns Google Drive file ID.

## Files of Interest
- `frontend/vercel.json` — build + rewrites + headers
- `frontend/.env.example` — env template
- `frontend/src/services/api.js` — smart wrapper
- `frontend/src/services/mockAuth.js` — mock backend
- `frontend/src/services/tokenStorage.js` — secure token wrapper
