import { expect, test } from "bun:test";
import { openDatabase } from "../src/db";
import { migrate } from "../src/migrate";

const dir = `${import.meta.dir}/../migrations`;

test("applies every migration once, in order", async () => {
  const db = openDatabase();
  expect(await migrate(db, dir)).toEqual([
    "001_events.sql",
    "002_users.sql",
    "003_index_by_time.sql",
  ]);
  expect(await migrate(db, dir)).toEqual([]); // already up to date
  expect(db.query("PRAGMA user_version").get()).toEqual({
    user_version: 3,
  });
});

test("the dashboard query searches the time index", async () => {
  const db = openDatabase();
  await migrate(db, dir);
  const plan = db
    .query(
      `EXPLAIN QUERY PLAN SELECT type, COUNT(*) FROM events
       WHERE ts >= 1 AND ts < 2 GROUP BY type`,
    )
    .all() as { detail: string }[];
  expect(plan[0]!.detail).toContain("INDEX events_ts_type");
});
