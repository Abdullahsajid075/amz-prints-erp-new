#!/usr/bin/env bash
# Generate local .env files for development if they don't already exist.
# These files are git-ignored; edit them freely for your machine.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

write_if_missing() {
  local file="$1"; shift
  if [ -f "$file" ]; then
    echo "[gen-env] keeping existing $file"
  else
    printf '%s\n' "$@" > "$file"
    echo "[gen-env] wrote $file"
  fi
}

write_if_missing "$ROOT/api/.env" \
  "SUPABASE_URL=http://localhost:3005" \
  "SUPABASE_API_KEY=local-dev-anon-key" \
  "CORS_ORIGINS=*" \
  "PORT=3000" \
  "NODE_ENV=development" \
  "DEFAULT_ADMIN_USER=admin" \
  "DEFAULT_ADMIN_PASSWORD=admin123"

write_if_missing "$ROOT/frontend/.env" \
  "# Local dev: talk to the Express API through Vite's dev proxy (/api -> localhost:3000)" \
  "REACT_APP_GAS_API_URL=/api"

write_if_missing "$ROOT/backend/.env" \
  "MONGO_URL=mongodb://localhost:27017" \
  "DB_NAME=amz_erp" \
  "CORS_ORIGINS=*"
