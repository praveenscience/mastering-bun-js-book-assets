const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("./config");
const context = require("./context");
const logger = require("./logger");
const metrics = require("./metrics");

function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use(context.middleware);
  app.use(metrics.middleware);

  app.get("/health", (req, res) =>
    res.json({ ok: true, pid: process.pid }),
  );

  app.get("/metrics", async (req, res) => {
    res.type(metrics.registry.contentType);
    res.send(await metrics.registry.metrics());
  });

  app.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    const user = db
      .prepare("SELECT * FROM customers WHERE email = ?")
      .get(String(email));
    const ok =
      user &&
      (await bcrypt.compare(String(password), user.password_hash));
    if (!ok) return res.status(401).json({ error: "invalid login" });
    const token = jwt.sign({ sub: user.id }, config.jwtSecret, {
      expiresIn: "1h",
    });
    logger.info("login", { customerId: user.id });
    res.json({ token });
  });

  function auth(req, res, next) {
    const header = req.get("authorization") || "";
    try {
      const token = header.replace(/^Bearer /, "");
      req.customerId = jwt.verify(token, config.jwtSecret).sub;
      next();
    } catch {
      res.status(401).json({ error: "unauthorized" });
    }
  }

  app.post("/invoices", auth, (req, res) => {
    const lines = req.body && req.body.lines;
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: "lines required" });
    }
    const total = lines.reduce(
      (sum, l) => sum + l.qty * l.unitCents,
      0,
    );
    const issuedOn = new Date().toISOString().slice(0, 10);
    const { lastInsertRowid } = db
      .prepare(
        "INSERT INTO invoices" +
          " (customer_id, issued_on, total_cents, lines)" +
          " VALUES (?, ?, ?, ?)",
      )
      .run(req.customerId, issuedOn, total, JSON.stringify(lines));
    logger.info("invoice created", { id: Number(lastInsertRowid) });
    res.status(201).json({ id: Number(lastInsertRowid), total });
  });

  app.get("/invoices/:id", auth, (req, res) => {
    const row = db
      .prepare(
        "SELECT * FROM invoices WHERE id = ? AND customer_id = ?",
      )
      .get(Number(req.params.id), req.customerId);
    if (!row) return res.status(404).json({ error: "not found" });
    res.json({ ...row, lines: JSON.parse(row.lines) });
  });

  app.get("/reports/revenue", (req, res) => {
    const { from = "0000-01-01", to = "9999-12-31" } = req.query;
    const rows = db
      .prepare(
        "SELECT issued_on AS day, SUM(total_cents) AS cents," +
          " COUNT(*) AS invoices FROM invoices" +
          " WHERE issued_on BETWEEN ? AND ? GROUP BY day ORDER BY day",
      )
      .all(String(from), String(to));
    res.json({ from, to, days: rows });
  });

  app.use((err, req, res, next) => {
    logger.error("unhandled", { message: err.message });
    res.status(500).json({ error: "internal" });
  });

  return app;
}

module.exports = { createApp };
