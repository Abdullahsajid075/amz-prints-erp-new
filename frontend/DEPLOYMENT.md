# Frontend deployment

**Current production setup (as of 2026-10-16): `erp.amzprints.com` is hosted directly on
Hostinger (static build uploaded to `/domains/erp.amzprints.com/public_html/`), calling the
API at `https://api.amzprints.com` (also Hostinger, GitHub-deployed Web App), which talks to
Supabase. This replaced the previous Vercel-hosted frontend after Vercel paused deployments
for exceeding the free-tier bandwidth limit.**

## Automatic deploy (as of 2026-10-19)

Every push to `main` that touches `frontend/**` now builds and uploads `dist/` to Hostinger
automatically via [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml)
— no manual build/upload step needed anymore. This fixes the recurring problem where merged
UI fixes never actually reached the live site because the manual upload step kept getting
skipped.

**One-time setup required** — add these as GitHub repo secrets
(repo → Settings → Secrets and variables → Actions → New repository secret):

| Secret | Value | Where to find it |
|---|---|---|
| `HOSTINGER_SSH_HOST` | SSH hostname/IP | hPanel → Advanced → SSH Access |
| `HOSTINGER_SSH_PORT` | SSH port (often `65002`, not `22`, on Hostinger shared hosting) | hPanel → Advanced → SSH Access |
| `HOSTINGER_SSH_USER` | SSH username | hPanel → Advanced → SSH Access |
| `HOSTINGER_SSH_PASSWORD` **or** `HOSTINGER_SSH_KEY` | SSH password, or a private key's contents (key is preferred; set only one) | hPanel SSH settings, or generate a key pair and add the public half there |
| `HOSTINGER_TARGET_PATH` | optional, defaults to `/domains/erp.amzprints.com/public_html` | — |

Once those secrets exist, either push a frontend change, or trigger it manually without a new
commit: repo → **Actions** tab → **Deploy frontend to Hostinger** → **Run workflow**.

## Manual deploy (fallback, if the workflow above isn't set up yet)

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
