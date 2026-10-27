import { openDatabase } from "./db";
import { migrate } from "./migrate";
import { createRepo } from "./repo";
import { startServer } from "./server";

// One connection for the whole process, opened once at start-up.
const db = openDatabase(process.env.DB_PATH ?? "events.db");
const applied = await migrate(db, `${import.meta.dir}/../migrations`);
if (applied.length) console.log("applied migrations:", applied);

const server = startServer(
  createRepo(db),
  Number(process.env.PORT ?? 3000),
);
console.log(`Event store on ${server.url}`);
