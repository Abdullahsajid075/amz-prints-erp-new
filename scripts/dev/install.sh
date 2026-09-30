#!/usr/bin/env bash
# One-time (idempotent) setup for the AMZ Prints ERP dev environment.
# Installs system packages, the PostgREST binary, and all app dependencies.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEVTOOLS="$ROOT/.devtools"
POSTGREST_VERSION="v16.2"
mkdir -p "$DEVTOOLS"

echo "==> Installing system packages (postgres, mongodb, python venv, tooling)"
export DEBIAN_FRONTEND=noninteractive

# MongoDB is not in the default Ubuntu repos; add the official 8.0 repo.
if [ ! -f /usr/share/keyrings/mongodb-server-8.0.gpg ]; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
    | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
fi
UBU_CODENAME="$(. /etc/os-release && echo "$VERSION_CODENAME")"
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBU_CODENAME}/mongodb-org/8.0 multiverse" \
  | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list >/dev/null

sudo apt-get update -qq
sudo apt-get install -y -qq \
  postgresql postgresql-contrib \
  python3-venv python3.12-venv \
  mongodb-org-server \
  curl xz-utils ca-certificates

echo "==> Installing PostgREST ${POSTGREST_VERSION}"
if [ ! -x "$DEVTOOLS/postgrest" ]; then
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64) PGRST_ASSET="postgrest-${POSTGREST_VERSION}-linux-static-x86-64.tar.xz" ;;
    aarch64|arm64) PGRST_ASSET="postgrest-${POSTGREST_VERSION}-linux-static-aarch64.tar.xz" ;;
    *) echo "Unsupported arch: $ARCH" >&2; exit 1 ;;
  esac
  curl -sSL -o "$DEVTOOLS/postgrest.tar.xz" \
    "https://github.com/PostgREST/postgrest/releases/download/${POSTGREST_VERSION}/${PGRST_ASSET}"
  tar Jxf "$DEVTOOLS/postgrest.tar.xz" -C "$DEVTOOLS"
  rm -f "$DEVTOOLS/postgrest.tar.xz"
fi
"$DEVTOOLS/postgrest" --version

echo "==> Installing frontend dependencies"
( cd "$ROOT/frontend" && npm install --no-audit --no-fund )

echo "==> Installing API dependencies"
( cd "$ROOT/api" && npm install --no-audit --no-fund )

echo "==> Installing backend (FastAPI) dependencies"
( cd "$ROOT/backend"
  [ -d .venv ] || python3 -m venv .venv
  ./.venv/bin/pip install --quiet --upgrade pip
  # emergentintegrations is published only on Emergent's private index and is not
  # imported by server.py, so it is skipped for local development.
  grep -v '^emergentintegrations' requirements.txt > /tmp/amz-backend-reqs.txt
  ./.venv/bin/pip install --quiet -r /tmp/amz-backend-reqs.txt
)

echo "==> Generating local .env files (if missing)"
bash "$ROOT/scripts/dev/gen-env.sh"

echo "==> Starting Postgres and bootstrapping the database"
sudo pg_ctlcluster 16 main start 2>/dev/null || true
bash "$ROOT/scripts/dev/bootstrap-db.sh"

echo "==> Install complete."
