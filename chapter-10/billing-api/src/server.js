const cluster = require("cluster");
const os = require("os");
const config = require("./config");
const { open } = require("./db");
const { createApp } = require("./app");

function start() {
  const app = createApp(open(config.dbPath));
  const server = app.listen(config.port, "127.0.0.1", () => {
    console.log(`billing-api ${process.pid} on :${config.port}`);
  });
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

if (require.main === module) {
  if (config.workers > 0 && cluster.isPrimary) {
    const n = Math.min(config.workers, os.cpus().length);
    for (let i = 0; i < n; i++) cluster.fork();
  } else {
    start();
  }
}

module.exports = { start };
