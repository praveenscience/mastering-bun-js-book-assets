// The same broadcast server on Node.js with the ws package.
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 4002, host: "127.0.0.1" });
wss.on("connection", (socket) => {
  socket.on("message", (data, isBinary) => {
    for (const client of wss.clients) {
      if (client.readyState === 1)
        client.send(data, { binary: isBinary });
    }
  });
});
console.log("Node + ws broadcast server on ws://127.0.0.1:4002");
