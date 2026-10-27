// Broadcast server on Bun's built-in WebSockets.
const server = Bun.serve({
  port: 4001,
  hostname: "127.0.0.1",
  fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response("WebSocket only", { status: 400 });
  },
  websocket: {
    open(ws) {
      ws.subscribe("room");
    },
    message(_ws, message) {
      server.publish("room", message); // to every client, sender too
    },
  },
});
console.log(`Bun broadcast server on ${server.url}`);
