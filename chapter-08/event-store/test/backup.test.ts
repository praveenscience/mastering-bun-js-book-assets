import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { backup } from "../src/backup";
import { openDatabase } from "../src/db";
import { migrate } from "../src/migrate";
import { createRepo } from "../src/repo";

test("backs up a live database to one consistent file", async () => {
  const dir = mkdtempSync(join(tmpdir(), "backup-"));
  const db = openDatabase(join(dir, "live.db"));
  await migrate(db, `${import.meta.dir}/../migrations`);
  const repo = createRepo(db);
  repo.insertMany([{ ts: 1, type: "view", userId: "ann", ms: 1 }]);

  backup(db, join(dir, "copy.db"));
  repo.insertMany([{ ts: 2, type: "view", userId: "ann", ms: 1 }]);

  const copy = new Database(join(dir, "copy.db"), { readonly: true });
  expect(copy.query("SELECT COUNT(*) AS n FROM events").get()).toEqual({
    n: 1,
  });
  expect(copy.query("PRAGMA user_version").get()).toEqual({
    user_version: 3,
  });
  copy.close();
  db.close();
  rmSync(dir, { recursive: true });
});
