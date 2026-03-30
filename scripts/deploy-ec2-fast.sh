#!/usr/bin/env bash
# Optimized EC2 deploy: 8G swap, higher swappiness during build, larger Node heap
# (webpack/TS use RAM+swap instead of SIGKILL on small instances).
#
# If outbound HTTPS to registry.npmjs.org fails (timeouts), npm i cannot run on the server.
# Workaround: from a machine with npm access, create tarballs of pure-JS packages and scp:
#   cd repo/node_modules && COPYFILE_DISABLE=1 tar czf /tmp/fe-qr.tgz react-qr-code qr.js prop-types loose-envify object-assign react-is
#   cd repo/backend/node_modules && COPYFILE_DISABLE=1 tar czf /tmp/be-qr.tgz qrcode dijkstrajs pngjs yargs
# Then on server: extract into respective node_modules before npm run build.
set -euo pipefail

REPO="${REPO:-/home/ubuntu/collegefinder}"
LOG="${DEPLOY_LOG:-/tmp/deploy-ec2-fast.log}"

exec > >(tee -a "$LOG") 2>&1

echo "=== deploy-ec2-fast start $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
free -h
swapon --show || true

ensure_swap_8g() {
  if swapon --show 2>/dev/null | awk 'NR>1 {print $1}' | grep -qx /swapfile; then
    return 0
  fi
  echo "Enabling 8G /swapfile..."
  sudo swapoff /swapfile 2>/dev/null || true
  sudo rm -f /swapfile
  sudo fallocate -l 8G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=8192 status=none
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab 2>/dev/null; then
    echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
  fi
}

ensure_swap_8g
free -h
swapon --show

OLD_SWAPPINESS="$(sysctl -n vm.swappiness 2>/dev/null || echo 60)"
sudo sysctl -w vm.swappiness=75

cleanup() {
  sudo sysctl -w "vm.swappiness=$OLD_SWAPPINESS" 2>/dev/null || true
}
trap cleanup EXIT

cd "$REPO"
git pull

export npm_config_fetch_retries=20
export npm_config_fetch_timeout=600000
# Fewer parallel TCP connections to registry (helps flaky EC2 → npmjs routes)
export npm_config_maxsockets=5

npm_install_with_retry() {
  local dir="$1"
  local label="$2"
  local attempt
  for attempt in 1 2 3; do
    echo "npm i ($label) attempt $attempt/3..."
    if (cd "$dir" && NODE_OPTIONS="--dns-result-order=ipv4first" npm i); then
      return 0
    fi
    echo "npm i ($label) failed; waiting 25s before retry..."
    sleep 25
  done
  return 1
}

# Sequential installs: less registry contention than parallel on small instances / weak paths to npm
npm_install_with_retry "$REPO" "frontend"
npm_install_with_retry "$REPO/backend" "backend"

pm2 stop collegefinder-frontend 2>/dev/null || true
rm -f "$REPO/.next/lock"

cd "$REPO"
export NEXT_TELEMETRY_DISABLED=1
# Larger heap + 8G swap: faster compile/TS than 1024MB cap; avoids thrashing GC as much
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"

echo "next build..."
npm run build

pm2 restart all
pm2 save

sleep 6
curl -s -o /dev/null -w "3000:%{http_code}\n" --max-time 20 http://127.0.0.1:3000/ || true
curl -s -o /dev/null -w "5001:%{http_code}\n" --max-time 20 http://127.0.0.1:5001/ || true
pm2 list

echo "=== deploy-ec2-fast done $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
