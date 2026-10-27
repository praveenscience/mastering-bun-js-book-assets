// Shows what ws.send() returns when a client stops reading.
// Run "bun backpressure.ts", then "node slow-client.mjs" elsewhere.
const chunk = "x".repeat(64 * 1024); // 64 KB
Bun.serve({
  port: 3062,
  hostname: "127.0.0.1",
  fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response("Expected a WebSocket", { status: 426 });
  },
  websocket: {
    backpressureLimit: 1024 * 1024, // 1 MB
    open(ws) {
      const results: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        const r = ws.send(chunk);
        const key = r > 0 ? "sent" : r === -1 ? "queued" : "dropped";
        results[key] = (results[key] ?? 0) + 1;
      }
      console.log(results);
    },
    drain() {
      console.log("drain: the client is reading again");
    },
  },
});
