#!/bin/sh
# Ensure node_modules is populated when using volume mounts (dev)
# The anonymous volume /app/node_modules can be empty on first run
if [ ! -d /app/node_modules/aws-sdk ]; then
  echo "Installing dependencies (node_modules empty or missing)..."
  npm install
fi
exec "$@"
