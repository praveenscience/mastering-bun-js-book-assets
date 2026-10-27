CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  issued_on TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  lines TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS invoices_by_date ON invoices(issued_on);
