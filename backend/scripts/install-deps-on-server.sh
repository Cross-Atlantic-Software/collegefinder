#!/bin/bash
# Run this ON THE SERVER to install backend deps. Use nohup if you might disconnect.
#
# Interactive (stay in SSH):
#   cd /home/ubuntu/collegefinder/backend && bash scripts/install-deps-on-server.sh
#
# Background (safe if SSH drops):
#   cd /home/ubuntu/collegefinder/backend && nohup bash scripts/install-deps-on-server.sh > npm-install.log 2>&1 &
#   tail -f npm-install.log

set -e
BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BACKEND_DIR"
LOG="${BACKEND_DIR}/npm-install.log"

echo "[$(date -Iseconds)] Installing dependencies in $BACKEND_DIR"
npm config set fetch-timeout 120000 fetch-retries 5 2>/dev/null || true
for attempt in 1 2 3; do
  npm install 2>&1 | tee "$LOG"
  if [ "${PIPESTATUS[0]}" -eq 0 ]; then break; fi
  echo "[$(date -Iseconds)] Attempt $attempt failed, retrying in 10s..."
  sleep 10
done
echo "[$(date -Iseconds)] Done. Restarting backend..."
pm2 restart collegefinder-backend 2>/dev/null || true
echo "[$(date -Iseconds)] All set."
