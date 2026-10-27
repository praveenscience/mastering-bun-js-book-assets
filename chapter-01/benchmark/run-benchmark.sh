#!/usr/bin/env bash
# Usage: start ONE server (bun bench-bun.ts  OR  node bench-node.mjs), then run this script.
set -euo pipefail
URL="${1:-http://localhost:3000}"
WORKERS="${WORKERS:-1}"   # set WORKERS=4 if the load generator is the bottleneck
echo "Warm-up (ignore)"; autocannon -w "$WORKERS" -c 100 -d 5 "$URL" > /dev/null
for run in 1 2 3; do echo "== Run $run =="; autocannon -w "$WORKERS" -c 100 -d 10 "$URL"; done
