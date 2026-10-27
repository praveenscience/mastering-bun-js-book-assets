// Opens a WebSocket by hand, then stops reading for 3 seconds.
import net from "node:net";

const socket = net.connect(3062, "127.0.0.1", () => {
  socket.write(
    "GET / HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\n" +
      "Connection: Upgrade\r\nSec-WebSocket-Version: 13\r\n" +
      "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n",
  );
});
socket.once("data", () => {
  socket.pause(); // stop reading: the server must buffer
  setTimeout(() => {
    socket.resume();
    socket.on("data", () => {});
    setTimeout(() => process.exit(0), 1000);
  }, 3000);
});
