#!/bin/bash
# Full deploy on server: pull, backend npm install, frontend build, PM2 restart.
# Run from repo root so npm install doesn't get killed by SSH timeout, use nohup if needed.
#
# From server (interactive):
#   cd /home/ubuntu/collegefinder && bash backend/scripts/deploy-on-server.sh
#
# From server (survives SSH disconnect):
#   cd /home/ubuntu/collegefinder && nohup bash backend/scripts/deploy-on-server.sh > deploy.log 2>&1 &
#   tail -f deploy.log

set -e
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$REPO_ROOT"

echo "[$(date -Iseconds)] Deploy: pull"
git pull

echo "[$(date -Iseconds)] Deploy: backend npm install"
cd "$REPO_ROOT/backend"
npm config set fetch-timeout 120000 fetch-retries 5 2>/dev/null || true
for attempt in 1 2 3; do
  if npm install; then break; fi
  echo "[$(date -Iseconds)] Attempt $attempt failed, retrying in 10s..."
  sleep 10
done
cd "$REPO_ROOT"

echo "[$(date -Iseconds)] Deploy: frontend build"
npm run build

echo "[$(date -Iseconds)] Deploy: PM2 restart"
pm2 restart all 2>/dev/null || true

echo "[$(date -Iseconds)] Deploy done."
