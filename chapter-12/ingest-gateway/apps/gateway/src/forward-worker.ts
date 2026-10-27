// Runs the forwarder on its own thread, with its own database
// connection (WAL lets it read while the gateway writes), so shipping
// events never competes with accepting them.
import { openStore } from "@igw/store";
import { Forwarder } from "./forwarder";
import { createLogger } from "./log";

declare var self: Worker;

type Start = { dbPath: string; url: string; batch: number };

self.onmessage = async (msg: MessageEvent<Start | "stop">) => {
  if (msg.data === "stop") {
    await forwarder?.stop();
    store?.db.close();
    postMessage({ type: "stopped" });
    return;
  }
  store = await openStore(msg.data.dbPath);
  forwarder = new Forwarder({
    store,
    url: msg.data.url,
    batch: msg.data.batch,
    log: createLogger("warn", { service: "forwarder" }),
    onSent: (n) => postMessage({ type: "sent", n }),
    onError: () => postMessage({ type: "error" }),
  });
  forwarder.start();
  setInterval(
    () => postMessage({ type: "lag", lag: forwarder!.lag }),
    1000,
  );
};

let store: Awaited<ReturnType<typeof openStore>> | undefined;
let forwarder: Forwarder | undefined;
