const bcrypt = require("bcrypt");
const request = require("supertest");
const { open } = require("../src/db");
const { createApp } = require("../src/app");

function setup() {
  const db = open(":memory:");
  db.prepare(
    "INSERT INTO customers (id, name, email, password_hash)" +
      " VALUES (1, 'Ada', 'ada@example.com', ?)",
  ).run(bcrypt.hashSync("password1", 4));
  return { db, app: createApp(db) };
}

async function login(app) {
  const res = await request(app)
    .post("/login")
    .send({ email: "ada@example.com", password: "password1" });
  return res.body.token;
}

module.exports = { setup, login };
