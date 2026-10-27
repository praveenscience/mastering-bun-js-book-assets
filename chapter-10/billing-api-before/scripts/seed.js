// Creates demo customers and a year of invoices.
const bcrypt = require("bcrypt");
const config = require("../src/config");
const { open } = require("../src/db");

const db = open(config.dbPath);
const hash = bcrypt.hashSync("password1", 10);
const addCustomer = db.prepare(
  "INSERT OR IGNORE INTO customers (id, name, email, password_hash)" +
    " VALUES (?, ?, ?, ?)",
);
const addInvoice = db.prepare(
  "INSERT INTO invoices (customer_id, issued_on, total_cents, lines)" +
    " VALUES (?, ?, ?, ?)",
);
db.transaction(() => {
  for (let c = 1; c <= 50; c++) {
    addCustomer.run(c, `Customer ${c}`, `c${c}@example.com`, hash);
  }
  for (let i = 0; i < 20000; i++) {
    const day = new Date(Date.UTC(2025, 0, 1) + (i % 365) * 864e5);
    const cents = 1000 + ((i * 7919) % 90000);
    const lines = [{ sku: `SKU-${i % 40}`, qty: 1, unitCents: cents }];
    addInvoice.run(
      (i % 50) + 1,
      day.toISOString().slice(0, 10),
      cents,
      JSON.stringify(lines),
    );
  }
})();
const { n } = db.prepare("SELECT COUNT(*) AS n FROM invoices").get();
console.log(`seeded ${n} invoices`);
