#!/usr/bin/env bash
#
# Repository bootstrap for the AMZ Prints ERP dev environment.
#
# Installs the toolchain for a fully self-contained local stack:
#   - Node dependencies for the Express API (api/) and the Vite frontend (frontend/)
#   - PostgreSQL (local cluster) + PostgREST 16 as a Supabase-compatible data layer
#   - Local .env files wiring the API to the local backend
#
# Idempotent and non-interactive: safe to re-run after pulling changes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
POSTGREST_VERSION="v16.2"
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW16X2FwaSJ9.8u_MDDSOqODXjxtxsvlVZ6S_eCYJcBketIQhz6t3vLo"

log() { echo "[install] $*"; }

# ---------------------------------------------------------------------------
# System packages: PostgreSQL server + client
# ---------------------------------------------------------------------------
if ! ls /usr/lib/postgresql/*/bin/postgres >/dev/null 2>&1; then
  log "Installing PostgreSQL"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib >/dev/null
else
  log "PostgreSQL already installed"
fi

# ---------------------------------------------------------------------------
# PostgREST binary (Supabase's data API server)
# ---------------------------------------------------------------------------
if ! command -v postgrest >/dev/null 2>&1; then
  log "Installing PostgREST $POSTGREST_VERSION"
  tmp="$(mktemp -d)"
  curl -sSL -o "$tmp/postgrest.tar.xz" \
    "https://github.com/PostgREST/postgrest/releases/download/${POSTGREST_VERSION}/postgrest-${POSTGREST_VERSION}-linux-static-x86-64.tar.xz"
  tar -xf "$tmp/postgrest.tar.xz" -C "$tmp"
  sudo mv "$tmp/postgrest" /usr/local/bin/postgrest
  sudo chmod +x /usr/local/bin/postgrest
  rm -rf "$tmp"
else
  log "PostgREST already installed"
fi

# ---------------------------------------------------------------------------
# Node dependencies
# ---------------------------------------------------------------------------
log "Installing API dependencies"
(cd "$REPO_DIR/api" && npm ci --no-audit --no-fund)

log "Installing frontend dependencies"
(cd "$REPO_DIR/frontend" && npm ci --no-audit --no-fund)

# ---------------------------------------------------------------------------
# Local .env files (git-ignored) wiring the API to the local backend
# ---------------------------------------------------------------------------
if [ ! -f "$REPO_DIR/api/.env" ]; then
  log "Writing api/.env"
  cat > "$REPO_DIR/api/.env" <<ENV
SUPABASE_URL=http://127.0.0.1:3001
SUPABASE_API_KEY=$JWT
CORS_ORIGINS=*
PORT=3000
NODE_ENV=development
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASSWORD=admin123
ENV
fi

if [ ! -f "$REPO_DIR/frontend/.env" ]; then
  log "Writing frontend/.env"
  echo "REACT_APP_GAS_API_URL=http://localhost:3000" > "$REPO_DIR/frontend/.env"
fi

log "Install complete"
