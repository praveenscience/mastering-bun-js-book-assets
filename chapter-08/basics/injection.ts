import { Database } from "bun:sqlite";

const db = new Database(":memory:", { strict: true });
db.run("CREATE TABLE users (name TEXT, role TEXT)");
db.run("INSERT INTO users VALUES ('ann', 'admin'), ('bob', 'user')");

const input = "nobody' OR '1'='1"; // typed into a search box

// UNSAFE: the input becomes part of the SQL text
const unsafe = db
  .query(`SELECT * FROM users WHERE name = '${input}'`)
  .all();
console.log("concatenated:", unsafe);

// SAFE: the input is bound as a value and never parsed as SQL
const safe = db
  .query("SELECT * FROM users WHERE name = $name")
  .all({ name: input });
console.log("parameterized:", safe);
