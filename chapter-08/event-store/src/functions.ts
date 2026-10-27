import type { Database } from "bun:sqlite";

// Adds SQL functions written in JavaScript to a connection.
export function registerFunctions(db: Database) {
  // p95(ms): the value below which 95% of a group's durations fall.
  // SQLite has no percentile function, so we supply one.
  db.aggregate("p95", {
    start: () => [] as number[], // a fresh array for each group
    step: (values: number[], ms: number) => {
      values.push(ms);
    },
    result: (values: number[]) => {
      if (values.length === 0) return null;
      values.sort((a, b) => a - b);
      return values[Math.ceil(values.length * 0.95) - 1]!;
    },
  });
}
