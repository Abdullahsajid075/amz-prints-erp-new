# Frontend — Vercel (easy)

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
