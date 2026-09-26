#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
PORT=3000

echo ""
echo "  Studio Portfolio — Local Demo"
echo "  ============================="
echo ""

if command -v node >/dev/null 2>&1; then
  echo "  Starting server with Node..."
  echo "  Open: http://localhost:$PORT"
  echo ""
  echo "  Press Ctrl+C to stop"
  echo ""
  npx --yes serve -l "$PORT" .
elif command -v python3 >/dev/null 2>&1; then
  echo "  Starting server with Python..."
  echo "  Open: http://localhost:8080"
  echo ""
  echo "  Press Ctrl+C to stop"
  echo ""
  python3 -m http.server 8080
elif command -v python >/dev/null 2>&1; then
  echo "  Starting server with Python..."
  echo "  Open: http://localhost:8080"
  echo ""
  python -m http.server 8080
else
  echo "  ERROR: Node.js or Python is required."
  echo "  Install Node: https://nodejs.org"
  exit 1
fi
