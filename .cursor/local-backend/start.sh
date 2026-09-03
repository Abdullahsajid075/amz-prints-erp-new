#!/usr/bin/env bash
#
# Idempotent local backend for the AMZ Prints ERP.
#
# Brings up a self-contained, Supabase-compatible data layer so the Express API
# (api/) can run end-to-end without a cloud Supabase project:
#
#   PostgreSQL (local cluster, port 5433)
#     -> PostgREST 16 (port 3010)  -- same data API Supabase exposes
#       -> rest-shim (port 3001)   -- maps /rest/v1/* onto PostgREST root
#
# The Express API points SUPABASE_URL at the shim and uses a signed service JWT.
# Safe to run repeatedly: it initialises the cluster once, then reconciles state.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
STATE_DIR="$HOME/.local/amz-erp"
PGDATA="$STATE_DIR/pgdata"
LOGS_DIR="$STATE_DIR/logs"
PGPORT=5433
DB_NAME=amzerp
JWT_SECRET="amz-erp-local-dev-postgrest-jwt-secret-0001"
POSTGREST_PORT=3010
SHIM_PORT=3001

mkdir -p "$LOGS_DIR"
export PGHOST="$STATE_DIR" PGPORT="$PGPORT"
PSQL=("$PG_BIN/psql" -h "$STATE_DIR" -p "$PGPORT" -U ubuntu -v ON_ERROR_STOP=1 -X -q)

log() { echo "[local-backend] $*"; }

# ---------------------------------------------------------------------------
# 1. Initialise the PostgreSQL cluster (once)
# ---------------------------------------------------------------------------
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  log "Initialising PostgreSQL cluster at $PGDATA"
  rm -rf "$PGDATA"
  mkdir -p "$PGDATA"
  "$PG_BIN/initdb" -D "$PGDATA" -U ubuntu --auth-local=trust --auth-host=trust >/dev/null
  {
    echo "port = $PGPORT"
    echo "listen_addresses = '127.0.0.1'"
    echo "unix_socket_directories = '$STATE_DIR'"
    echo "fsync = off"
    echo "full_page_writes = off"
  } >> "$PGDATA/postgresql.conf"
fi

# ---------------------------------------------------------------------------
# 2. Start PostgreSQL
# ---------------------------------------------------------------------------
if ! "$PG_BIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
  log "Starting PostgreSQL"
  "$PG_BIN/pg_ctl" -D "$PGDATA" -l "$LOGS_DIR/postgres.log" -w -t 60 start >/dev/null
else
  log "PostgreSQL already running"
fi

for _ in $(seq 1 30); do
  if "$PG_BIN/pg_isready" -h "$STATE_DIR" -p "$PGPORT" -q; then break; fi
  sleep 1
done

# ---------------------------------------------------------------------------
# 3. Database, roles and privileges (idempotent)
# ---------------------------------------------------------------------------
if ! "$PG_BIN/psql" -h "$STATE_DIR" -p "$PGPORT" -U ubuntu -tAc \
    "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" postgres | grep -q 1; then
  log "Creating database $DB_NAME"
  "$PG_BIN/createdb" -h "$STATE_DIR" -p "$PGPORT" -U ubuntu "$DB_NAME"
fi

"${PSQL[@]}" -d "$DB_NAME" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'amz_api') THEN
    CREATE ROLE amz_api NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN NOINHERIT;
  END IF;
END
$$;
GRANT amz_api TO authenticator;
SQL

# ---------------------------------------------------------------------------
# 4. Apply schema (schema.sql is written with IF NOT EXISTS -> safe to re-run)
# ---------------------------------------------------------------------------
log "Applying schema.sql"
"${PSQL[@]}" -d "$DB_NAME" -f "$REPO_DIR/api/schema.sql" >/dev/null

"${PSQL[@]}" -d "$DB_NAME" <<'SQL'
GRANT USAGE ON SCHEMA public TO amz_api;
GRANT ALL ON ALL TABLES IN SCHEMA public TO amz_api;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO amz_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO amz_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO amz_api;
SQL

# ---------------------------------------------------------------------------
# 5. Start PostgREST
# ---------------------------------------------------------------------------
POSTGREST_CONF="$STATE_DIR/postgrest.conf"
cat > "$POSTGREST_CONF" <<CONF
db-uri = "postgres://authenticator@127.0.0.1:$PGPORT/$DB_NAME"
db-schemas = "public"
db-anon-role = "amz_api"
jwt-secret = "$JWT_SECRET"
server-host = "127.0.0.1"
server-port = $POSTGREST_PORT
CONF

if ! curl -sf -o /dev/null "http://127.0.0.1:$POSTGREST_PORT/"; then
  log "Starting PostgREST on :$POSTGREST_PORT"
  nohup postgrest "$POSTGREST_CONF" > "$LOGS_DIR/postgrest.log" 2>&1 &
  for _ in $(seq 1 30); do
    if curl -sf -o /dev/null "http://127.0.0.1:$POSTGREST_PORT/"; then break; fi
    sleep 1
  done
else
  log "PostgREST already running"
  # Ensure schema cache is fresh after re-applying schema
  pkill -USR1 -x postgrest 2>/dev/null || true
fi

# ---------------------------------------------------------------------------
# 6. Start the /rest/v1 shim
# ---------------------------------------------------------------------------
SHIM_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:$SHIM_PORT/" || true)"
if [ "$SHIM_CODE" = "000" ] || [ -z "$SHIM_CODE" ]; then
  log "Starting rest-shim on :$SHIM_PORT"
  SHIM_PORT="$SHIM_PORT" POSTGREST_PORT="$POSTGREST_PORT" \
    nohup node "$SCRIPT_DIR/rest-shim.js" > "$LOGS_DIR/rest-shim.log" 2>&1 &
  sleep 1
else
  log "rest-shim already running"
fi

log "Local backend ready:"
log "  PostgreSQL : 127.0.0.1:$PGPORT (db=$DB_NAME)"
log "  PostgREST  : http://127.0.0.1:$POSTGREST_PORT"
log "  Shim (API) : http://127.0.0.1:$SHIM_PORT"
