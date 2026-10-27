#!/usr/bin/env bash
# Times cold (empty cache) and warm (full cache) installs for Bun and npm, three runs each.
set -euo pipefail
cd "$(dirname "$0")"
CACHE="$(mktemp -d)"
now() { perl -MTime::HiRes=time -e 'printf "%.3f\n", time'; }
run() { local label=$1; shift; local s e; s=$(now); "$@" >/dev/null 2>&1; e=$(now); printf '%-12s %.2fs\n' "$label" "$(echo "$e - $s" | bc)"; }
for i in 1 2 3; do rm -rf node_modules bun.lock "$CACHE/bun"; run "bun cold $i" bun install --cache-dir "$CACHE/bun"; done
for i in 1 2 3; do rm -rf node_modules; run "bun warm $i" bun install --cache-dir "$CACHE/bun"; done
for i in 1 2 3; do rm -rf node_modules package-lock.json "$CACHE/npm"; run "npm cold $i" npm install --cache "$CACHE/npm" --no-audit --no-fund; done
for i in 1 2 3; do rm -rf node_modules; run "npm warm $i" npm install --cache "$CACHE/npm" --no-audit --no-fund --prefer-offline; done
rm -rf node_modules bun.lock package-lock.json "$CACHE"
