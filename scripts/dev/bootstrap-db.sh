#!/usr/bin/env bash
# Idempotently prepare the local Postgres database that emulates Supabase:
# create the roles, the amz_erp database, apply the app schema, and grant the
# PostgREST anon role access. Safe to run on every boot.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB_NAME="${AMZ_DB_NAME:-amz_erp}"

psql_su() { sudo -u postgres psql -v ON_ERROR_STOP=1 "$@"; }

echo "[bootstrap-db] ensuring roles..."
psql_su -f "$ROOT/scripts/dev/db-roles.sql" >/dev/null

if ! psql_su -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo "[bootstrap-db] creating database ${DB_NAME}..."
  psql_su -c "CREATE DATABASE ${DB_NAME};" >/dev/null
fi

echo "[bootstrap-db] applying schema..."
psql_su -d "$DB_NAME" -f "$ROOT/api/schema.sql" >/dev/null

echo "[bootstrap-db] granting anon role privileges..."
psql_su -d "$DB_NAME" >/dev/null <<'SQL'
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO web_anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO web_anon;
SQL

echo "[bootstrap-db] done."
