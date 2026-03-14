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
npm install 2>&1 | tee "$LOG"
echo "[$(date -Iseconds)] Done. Restarting backend..."
pm2 restart collegefinder-backend 2>/dev/null || true
echo "[$(date -Iseconds)] All set."
