#!/bin/sh
# Times ten cold starts of each store and prints the median.
for name in raw drizzle prisma; do
  rm -f cold.db cold.db-*
  for i in 1 2 3 4 5 6 7 8 9 10; do
    /usr/bin/time -p bun bench/cold.ts "$name" 2>&1 |
      awk '/real/ {print $2}'
  done | sort -n |
    awk -v n="$name" '{a[NR]=$1} END {print n, a[5] " s"}'
done
rm -f cold.db cold.db-*
