const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

function open(file) {
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  return db;
}

module.exports = { open };
