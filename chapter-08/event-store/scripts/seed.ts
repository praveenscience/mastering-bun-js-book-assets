// Fills a development database with a week of realistic events:
//   bun scripts/seed.ts events.db
import { openDatabase } from "../src/db";
import { migrate } from "../src/migrate";
import { createRepo, type NewEvent } from "../src/repo";

const db = openDatabase(process.argv[2] ?? "events.db");
await migrate(db, `${import.meta.dir}/../migrations`);
const repo = createRepo(db);

const types = ["view", "view", "view", "click", "search", "purchase"];
const week = 7 * 24 * 3600 * 1000;
const start = Date.now() - week;
let stored = 0;
for (let batch = 0; batch < 100; batch++) {
  const events: NewEvent[] = [];
  for (let i = 0; i < 1000; i++) {
    events.push({
      ts: start + Math.floor(Math.random() * week),
      type: types[Math.floor(Math.random() * types.length)]!,
      userId: `user${Math.floor(Math.random() * 2000)}`,
      ms: Math.floor(Math.random() ** 3 * 3000), // mostly fast
    });
  }
  stored += repo.insertMany(events);
}
console.log(`seeded ${stored} events`);
console.table(repo.latency(start, Date.now()));
