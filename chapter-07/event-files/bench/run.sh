#!/bin/sh
# Runs each workload three times in Bun and in Node.js and prints the
# wall-clock time and peak memory of every run (macOS /usr/bin/time).
# Usage: sh bench/run.sh data/events.ndjson
FILE=${1:-data/events.ndjson}
run() {
  /usr/bin/time -l "$@" 2>&1 >/dev/null |
    awk -v name="$*" '/real/ {t=$1} /maximum resident/ {m=$1/1048576}
      END {printf "%-58s %6.2f s %7.0f MB\n", name, t, m}'
}
for i in 1 2 3; do
  run bun bench/count-whole.ts "$FILE"
  run node bench/count-whole.mjs "$FILE"
  run bun bench/count-stream.ts "$FILE"
  run node bench/count-stream.mjs "$FILE"
  run bun bench/hash.ts "$FILE"
  run node bench/hash.mjs "$FILE"
  run bun bench/gzip.ts "$FILE" /tmp/events-bun.gz
  run node bench/gzip.mjs "$FILE" /tmp/events-node.gz
done
