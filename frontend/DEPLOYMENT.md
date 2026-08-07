# AMZ Prints ERP — Frontend Deploy (Vercel)

Frontend = Vite + React. Backend = Google Apps Script (for now). Hostinger API later.

## Vercel project settings

| Setting | Value |
|--------|--------|
| Repository | `Abdullahsajid075/amz-prints-erp-new` |
| Branch | `main` (or `cursor/gas-api-integration` until merged) |
| **Root Directory** | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js | 18.x or 20.x |

### Environment variable (Production + Preview)

| Key | Value |
| --- | --- |
| `REACT_APP_GAS_API_URL` | `https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec` |

Set in: Vercel → Project → Settings → Environment Variables → Redeploy after saving.

## Domain: erp.amzprints.com

1. Vercel → Project → **Settings → Domains** → Add `erp.amzprints.com`
2. **Hostinger DNS pe pehle Hostinger A/AAAA records hatao** jo `erp` ko Hostinger Node IPs pe bhej rahe hain (warna timeout aayega).
3. DNS provider (jahan `amzprints.com` manage hota hai) pe ye add karo:

### Recommended (CNAME)

| Type | Name / Host | Value | TTL |
|------|-------------|-------|-----|
| **CNAME** | `erp` | `cname.vercel-dns.com` | Auto / 3600 |

### Alternate (A record) — if CNAME not allowed

| Type | Name / Host | Value | TTL |
|------|-------------|-------|-----|
| **A** | `erp` | `76.76.21.21` | Auto / 3600 |

4. Vercel Domains page pe **Valid** / SSL green hone ka wait (5–60 min).
5. Open: https://erp.amzprints.com

## Quick checklist

- [ ] Root Directory = `frontend`
- [ ] Env `REACT_APP_GAS_API_URL` set
- [ ] Deploy succeeded on Vercel
- [ ] Hostinger `erp` DNS removed
- [ ] Vercel CNAME/A for `erp` added
- [ ] Login works via GAS backend

## Local

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Files

- `frontend/vercel.json` — SPA rewrites + Vite build
- `frontend/vite.config.js` — env bake-in + React
- `frontend/src/services/gasClient.js` — API client
