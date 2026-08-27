#!/usr/bin/env bash
# Start local demo server for Studio Portfolio WordPress theme preview
PORT="${1:-8080}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo ""
echo "  Studio Portfolio — Local Demo"
echo "  ============================="
echo "  Open: http://localhost:$PORT/demo/"
echo ""
echo "  Press Ctrl+C to stop"
echo ""
cd "$DIR" && python3 -m http.server "$PORT"
