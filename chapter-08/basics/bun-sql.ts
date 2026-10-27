import { SQL } from "bun";

// Bun's SQL client speaks PostgreSQL, MySQL, and SQLite with one API.
// Change the URL to postgres://... and the code below stays the same.
const sql = new SQL(process.env.DATABASE_URL ?? "sqlite://:memory:");

await sql`CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY,
  body TEXT NOT NULL)`;
const body = "Robert'); DROP TABLE notes;--";
// The value is bound as a parameter, not spliced into the SQL
await sql`INSERT INTO notes (body) VALUES (${body})`;
const rows = await sql`SELECT id, body FROM notes`;
console.log(rows);
await sql.close();
