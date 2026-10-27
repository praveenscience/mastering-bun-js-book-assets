import { createFeed } from "./feed";
import { startServer } from "./server";
import homepage from "../public/index.html";

const feed = createFeed();
const app = startServer({
  feed,
  homepage,
  port: Number(process.env.PORT ?? 3000),
  tokens: new Map([["demo-token", "demo"]]),
  allowedOrigins: [`http://localhost:${process.env.PORT ?? 3000}`],
});
const timer = setInterval(() => feed.tick(), 250);
console.log(`FX board on ${app.server.url}`);

process.on("SIGTERM", async () => {
  console.log("SIGTERM: draining");
  clearInterval(timer);
  await app.shutdown(5_000);
  console.log("stopped");
  process.exit(0);
});
