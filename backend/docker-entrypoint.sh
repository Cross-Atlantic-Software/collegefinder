#!/bin/sh
# Ensure node_modules is synced when using volume mounts (dev)
# Anonymous volume /app/node_modules can be stale; always run npm install in dev
if [ "$NODE_ENV" = "development" ] && [ -f /app/package.json ]; then
  echo "Syncing dependencies (npm install)..."
  npm install
fi
exec "$@"
