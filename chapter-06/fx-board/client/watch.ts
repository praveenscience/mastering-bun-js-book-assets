// Prints live GBPUSD rates and keeps going across server restarts:
//   bun client/watch.ts
import { connectLive } from "./live-client";

connectLive({
  baseUrl: process.env.FX_URL ?? "http://localhost:3000",
  token: "demo-token",
  pairs: ["GBPUSD"],
  onMessage(msg) {
    const time = new Date().toISOString().slice(11, 19);
    if (msg.type === "rate") {
      console.log(time, msg.pair, msg.bid, msg.ask, `#${msg.seq}`);
    } else {
      console.log(time, msg.type);
    }
  },
});
