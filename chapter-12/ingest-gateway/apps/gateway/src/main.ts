import { openStore } from "@igw/store";
import { loadConfig } from "./config";
import { startGateway } from "./gateway";

const config = loadConfig();
const gateway = startGateway(config, await openStore(config.dbPath));

let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    await gateway.stop();
    process.exit(0);
  });
}
