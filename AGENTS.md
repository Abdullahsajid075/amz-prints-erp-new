# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **AMZ Prints ERP** monorepo. The primary product is the ERP web app made of two
services plus a local database:

| Service | Path | Dev command | Port | Notes |
|---------|------|-------------|------|-------|
| ERP frontend (React 19 + Vite 6) | `frontend/` | `npm run dev` | 5173 | Talks to the API via `REACT_APP_GAS_API_URL`. |
| ERP API (Express + Supabase) | `api/` | `npm run dev` | 3000 | All ERP data flows through here. |
| Supabase (Postgres + PostgREST + Kong) | local Docker stack in `~/supabase-local` | `supabase start` | 54321 (API), 54322 (Postgres) | The API reads/writes this via `@supabase/supabase-js`. |

The legacy `backend/` (FastAPI + Mongo), `gas/` (Google Apps Script), and `wordpress-theme/` are
NOT part of the ERP runtime and are not needed to run/test the ERP.

### Starting the environment (services are not auto-started)

The update script only refreshes npm dependencies. Docker + Supabase + the dev servers must be
started manually each session. Docker images and the Postgres data volume persist in the VM
snapshot, so `supabase start` is fast after the first run and the seeded data survives restarts.

1. Start the Docker daemon (not running by default):
   - `sudo dockerd` (run it in a background/tmux session; leave it running).
   - The `ubuntu` user is in the `docker` group. In a brand-new shell the group is already active;
     if you hit `permission denied ... docker.sock`, either open a new shell or prefix docker/
     supabase commands with `sg docker -c "..."`.
2. Start Supabase (only db, rest, kong are needed — the rest are excluded to save resources):
   - `cd ~/supabase-local && supabase start -x realtime,storage-api,imgproxy,mailpit,studio,edge-runtime,logflare,vector,supavisor,postgres-meta,gotrue`
3. Start the API: `cd api && npm run dev`  → http://localhost:3000/health should return `{"ok":true,...}`.
4. Start the frontend: `cd frontend && npm run dev` → http://localhost:5173.

### Database / env caveats (non-obvious)

- The API talks to Supabase through the Kong gateway at `http://127.0.0.1:54321` (path `/rest/v1`).
  `api/.env` is pre-created (gitignored) with `SUPABASE_URL`, a long-lived `service_role` JWT in
  `SUPABASE_API_KEY`, `CORS_ORIGINS`, and `PORT=3000`. `frontend/.env` sets
  `REACT_APP_GAS_API_URL=http://localhost:3000`.
- This CLI's local JWT secret is the classic `super-secret-jwt-token-with-at-least-32-characters-long`.
  The `service_role` key in `api/.env` is an HS256 JWT signed with it (`role: service_role`), so it
  stays valid across restarts.
- The DB schema is `api/schema.sql`. If you ever recreate the DB (`supabase db reset` or a fresh
  volume), you must re-apply it AND re-grant privileges (Supabase's default privileges are not
  applied to tables created via raw `psql`), otherwise PostgREST returns `42501 permission denied`:
  - Apply schema: `docker exec -i supabase_db_supabase-local psql -U postgres -d postgres < api/schema.sql`
  - Grant roles: run `GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;` and
    `GRANT ALL ON ALL TABLES/SEQUENCES/FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;`
    plus matching `ALTER DEFAULT PRIVILEGES`, then `NOTIFY pgrst, 'reload schema';`
  - Re-seed admin + walk-in customer: `cd api && npm run migrate:seed`.
- Default login seeded for the ERP: **admin / admin123**.

### Lint / test / build

- There is **no lint config** (ESLint is a dependency but no `eslint.config.js` and no `lint`
  script exist) and **no automated test suite** for the ERP. Do not assume `npm run lint`/`npm test`
  exist here.
- Build (validates the toolchain): `cd frontend && npm run build`.
- Standard run commands live in `frontend/package.json` and `api/package.json` scripts; the
  Supabase/Hostinger deployment steps are in `api/README.md`.
