#!/usr/bin/env bash
# Runs every case under Node.js and Bun and prints a summary line
# for each: "ok" plus the output, or the first line of the error.
cd "$(dirname "$0")/cases"
for file in [0-9]-*; do
  for runtime in node bun; do
    if out=$($runtime "$file" 2>&1); then
      result="ok: $(echo "$out" | tr '\n' ' ')"
    else
      result="FAILS: $(echo "$out" | grep -m1 -E 'Error|error')"
    fi
    printf '%-22s %-5s %s\n' "$file" "$runtime" "${result:0:60}"
  done
done
