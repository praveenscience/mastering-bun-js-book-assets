import { Database } from "bun:sqlite";

// A deliberately slow query: count to 20 million in SQL.
export const SLOW = `WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL
  SELECT i + 1 FROM n WHERE i < 20000000) SELECT COUNT(*) AS c FROM n`;

export function runSlow() {
  return new Database(":memory:").query(SLOW).get();
}
