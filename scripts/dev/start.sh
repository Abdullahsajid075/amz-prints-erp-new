#!/usr/bin/env bash
# Per-boot startup: bring up the infrastructure the app servers depend on
# (Postgres, PostgREST, the Supabase proxy, and MongoDB). Idempotent and
# non-blocking: the actual dev servers run as environment `terminals`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEVTOOLS="$ROOT/.devtools"
mkdir -p "$DEVTOOLS"

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && { exec 3>&- 3<&-; return 0; } || return 1; }

echo "==> Ensuring local .env files exist"
bash "$ROOT/scripts/dev/gen-env.sh"

echo "==> Starting PostgreSQL"
sudo pg_ctlcluster 16 main start 2>/dev/null || true

echo "==> Bootstrapping database (idempotent)"
bash "$ROOT/scripts/dev/bootstrap-db.sh"

echo "==> Starting MongoDB"
if ! port_open 27017; then
  mkdir -p "$DEVTOOLS/mongo-data"
  mongod --dbpath "$DEVTOOLS/mongo-data" --bind_ip 127.0.0.1 --port 27017 \
    --fork --logpath "$DEVTOOLS/mongod.log"
else
  echo "    MongoDB already running on :27017"
fi

echo "==> Starting PostgREST"
if ! port_open 3001; then
  nohup "$DEVTOOLS/postgrest" "$ROOT/scripts/dev/postgrest.conf" \
    > "$DEVTOOLS/postgrest.log" 2>&1 &
  echo "    PostgREST starting on :3001"
else
  echo "    PostgREST already running on :3001"
fi

echo "==> Starting Supabase proxy"
if ! port_open 3005; then
  nohup node "$ROOT/scripts/dev/supabase-proxy.js" \
    > "$DEVTOOLS/supabase-proxy.log" 2>&1 &
  echo "    Supabase proxy starting on :3005"
else
  echo "    Supabase proxy already running on :3005"
fi

echo "==> Infrastructure ready (Postgres:5432 PostgREST:3001 Supabase-proxy:3005 MongoDB:27017)"
