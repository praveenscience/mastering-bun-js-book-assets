#!/usr/bin/env bash
# Installs and tests one project of the book, the same way CI does.
# Usage: scripts/test-project.sh chapter-05/orders-service
#        scripts/test-project.sh all
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECTS=(
  chapter-01/hello-bun
  chapter-02/scaffold
  chapter-02/testing
  chapter-02/env-demo
  chapter-04/acme-shop
  chapter-05/orders-service
  chapter-06/fx-board
  chapter-06/frameworks
  chapter-07/event-files
  chapter-08/event-store
  chapter-08/orm-compare
  chapter-09/pixel-kernels
  chapter-10/billing-api
  chapter-10/billing-next
  chapter-10/edge-router
  chapter-11/notify-service
  chapter-12/ingest-gateway
)

run() {
  local dir="$1"
  echo "=== $dir"
  (
    cd "$dir"
    # Projects with dependencies use their committed lockfile.
    if [ -f bun.lock ]; then bun install --frozen-lockfile
    elif [ -f package.json ]; then bun install; fi
    case "$dir" in
      chapter-08/orm-compare) bun run db:generate ;;
      chapter-09/pixel-kernels) ./build.sh ;;
    esac
    if grep -q '"typecheck"' package.json 2>/dev/null; then
      bun run typecheck
    fi
    # A project's own test script wins: Chapter 4's workspace runs
    # each package's tests with that package's plugin preload.
    if grep -q '"test"' package.json 2>/dev/null; then
      bun run test
    else
      bun test
    fi
  )
}

if [ "${1:-all}" = "all" ]; then
  for p in "${PROJECTS[@]}"; do run "$p"; done
else
  run "$1"
fi
