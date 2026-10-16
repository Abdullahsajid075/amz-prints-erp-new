# Frontend deployment

**Current production setup (as of 2026-10-16): `erp.amzprints.com` is hosted directly on
Hostinger (static build uploaded to `/domains/erp.amzprints.com/public_html/`), calling the
API at `https://api.amzprints.com` (also Hostinger, GitHub-deployed Web App), which talks to
Supabase. This replaced the previous Vercel-hosted frontend after Vercel paused deployments
for exceeding the free-tier bandwidth limit.**

To redeploy the Hostinger-hosted frontend after a change:

```bash
cd frontend
REACT_APP_GAS_API_URL=https://api.amzprints.com npm run build
# Upload the contents of dist/ (including .htaccess) to
# /domains/erp.amzprints.com/public_html/ via SSH/SCP, SFTP, or hPanel File Manager.
```

`public/.htaccess` (copied into `dist/` by the build) provides the SPA fallback rewrite and
static asset caching needed on Hostinger's Apache/LiteSpeed stack.

## Alternative — Vercel (easy, but watch the bandwidth limit)

Stack: **Vercel UI → Hostinger API → Supabase**

## Vercel settings

| Setting | Value |
|--------|--------|
| Root Directory | `frontend` |
| Framework | Vite |
| Build | `npm run build` |
| Output | `dist` |

## Env (required)

```env
REACT_APP_GAS_API_URL=https://YOUR-HOSTINGER-API-URL
```

Example: `https://something.hostingersite.com`  
(No trailing slash needed.)

Redeploy after changing env.

## Domain

- Add `erp.amzprints.com` in Vercel Domains  
- DNS: CNAME `erp` → `cname.vercel-dns.com`  
- Remove Hostinger A records from `erp` if still pointing there

## Checklist

1. Hostinger `/health` works  
2. Vercel env = that Hostinger URL  
3. Redeploy frontend  
4. Login on erp.amzprints.com  
