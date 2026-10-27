require("dotenv").config();
const path = require("path");

module.exports = {
  port: Number(process.env.PORT || 3000),
  dbPath:
    process.env.DB_PATH || path.join(__dirname, "../data/billing.db"),
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  workers: Number(process.env.WORKERS || 0),
};
