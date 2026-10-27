import { openDatabase } from "../src/db";
import { migrate } from "../src/migrate";
import { createRepo } from "../src/repo";

export async function freshRepo() {
  const db = openDatabase(":memory:");
  await migrate(db, `${import.meta.dir}/../migrations`);
  return { db, repo: createRepo(db) };
}
