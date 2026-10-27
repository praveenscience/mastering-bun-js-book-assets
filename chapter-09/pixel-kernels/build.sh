#!/usr/bin/env bash
# Builds the native libraries into native/build/.
# C needs clang or gcc; Rust and Zig are skipped if not installed.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p native/build

case "$(uname -s)" in
  Darwin) ext=dylib; shared=-dynamiclib ;;
  *) ext=so; shared="-shared -fPIC" ;;
esac

cc -O2 -Wall $shared native/c/kernels.c \
  -o "native/build/libkernels.$ext"
echo "built native/build/libkernels.$ext"

if command -v cargo >/dev/null; then
  cargo build --release --quiet \
    --manifest-path native/rust/Cargo.toml
  cp "native/rust/target/release/libblur.$ext" \
    "native/build/libblur_rust.$ext"
  echo "built native/build/libblur_rust.$ext"
fi

if command -v zig >/dev/null; then
  zig build-lib native/zig/blur.zig -dynamic -OReleaseFast \
    -lc -femit-bin="native/build/libblur_zig.$ext"
  echo "built native/build/libblur_zig.$ext"
fi

# The Node-API addon needs Node's headers (they ship with Node).
headers="$(dirname "$(dirname "$(command -v node || echo /x/x)")")"
headers="$headers/include/node"
if [ -f "$headers/node_api.h" ]; then
  case "$ext" in
    dylib) addon_flags="-dynamiclib -undefined dynamic_lookup" ;;
    *) addon_flags="-shared -fPIC" ;;
  esac
  cc -O2 $addon_flags -I"$headers" native/napi/addon.c \
    native/c/kernels.c -o native/build/blur.node
  echo "built native/build/blur.node"
fi
