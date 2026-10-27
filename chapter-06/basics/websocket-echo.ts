// The smallest useful WebSocket server: it echoes every message.
const server = Bun.serve({
  port: 3000,
  hostname: "127.0.0.1",
  fetch(req, server) {
    const name = new URL(req.url).searchParams.get("name") ?? "guest";
    if (server.upgrade(req, { data: { name } })) return;
    return new Response("Expected a WebSocket", { status: 426 });
  },
  websocket: {
    data: {} as { name: string },
    open(ws) {
      ws.send(`hello, ${ws.data.name}`);
    },
    message(ws, message) {
      ws.send(`${ws.data.name} said: ${message}`);
    },
    close(ws, code) {
      console.log(`${ws.data.name} left with code ${code}`);
    },
  },
});
console.log(`WebSocket echo on ${server.url}`);
