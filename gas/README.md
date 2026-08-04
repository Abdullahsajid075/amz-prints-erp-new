# Google Apps Script Backend

Your Web App URL:
```
https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec
```

## Current status

Opening that URL returns **"Script function not found: doGet"** — the deployment exists but the script has no entry points yet.

## Quick setup (5 minutes)

1. Open [script.google.com](https://script.google.com) → your project linked to this deployment.
2. Replace all code with `gas/Code.gs` from this repo.
3. Create a Google Sheet → copy its ID from the URL.
4. In Apps Script: **Project Settings → Script properties** → add:
   - `SPREADSHEET_ID` = your sheet ID
5. Run `setupSheets` once (authorize when prompted) — creates tabs + default admin user.
6. **Deploy → Manage deployments → Edit → New version → Deploy** (same Web App URL stays valid).

## Default login (after setupSheets)

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

## Frontend connection

**Local** — already in `frontend/.env`:
```
REACT_APP_GAS_API_URL=https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec
```

**Vercel** — Project → Settings → Environment Variables:
- Key: `REACT_APP_GAS_API_URL`
- Value: same URL above
- Redeploy after saving

## How routing works

The frontend sends requests like:
```
GET  .../exec?path=/orders
POST .../exec?path=/auth/login
POST .../exec?path=/orders/123&_method=PUT
```

GAS only supports `doGet` and `doPost`; PUT/DELETE/PATCH are sent as POST with `_method` query param (handled in `api.js`).

## Test after deploy

```bash
curl "https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec?path=/dashboard/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Login test:
```bash
curl -X POST "https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec?path=/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin\",\"password\":\"admin123\"}"
```
