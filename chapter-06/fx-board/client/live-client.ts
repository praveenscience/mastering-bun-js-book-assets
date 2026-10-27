import type { ServerMessage } from "../src/protocol";

// A client that survives restarts: it reconnects with backoff and,
// once connected again, re-sends its state (pairs and lastSeq).
export function connectLive(opts: {
  baseUrl: string; // for example http://localhost:3000
  token: string;
  pairs: string[];
  onMessage: (msg: ServerMessage) => void;
}) {
  let lastSeq = 0;
  let epoch = "";
  let attempt = 0;
  let stopped = false;
  let socket: WebSocket | undefined;

  async function connect() {
    const res = await fetch(`${opts.baseUrl}/tickets`, {
      method: "POST",
      headers: { authorization: `Bearer ${opts.token}` },
    });
    if (!res.ok) throw new Error(`Ticket refused: ${res.status}`);
    const { ticket } = (await res.json()) as { ticket: string };
    const wsUrl = opts.baseUrl.replace(/^http/, "ws");
    socket = new WebSocket(`${wsUrl}/ws?ticket=${ticket}`);
    socket.onopen = () => {
      attempt = 0;
      const { pairs } = opts;
      const msg = epoch
        ? { type: "resume", pairs, lastSeq, epoch }
        : { type: "subscribe", pairs };
      socket!.send(JSON.stringify(msg));
    };
    socket.onmessage = (event) => {
      const msg = JSON.parse(String(event.data)) as ServerMessage;
      if (msg.type === "welcome" && msg.epoch !== epoch) {
        epoch = msg.epoch; // a new server run: old seq numbers are void
        lastSeq = 0;
      }
      if (msg.type === "rate") lastSeq = Math.max(lastSeq, msg.seq);
      if (msg.type === "snapshot") {
        for (const r of msg.rates) lastSeq = Math.max(lastSeq, r.seq);
      }
      opts.onMessage(msg);
    };
    socket.onclose = () => {
      if (!stopped) scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    // 0.5 s, 1 s, 2 s ... up to 30 s, with random jitter so that
    // thousands of clients do not all return in the same instant.
    const base = Math.min(30_000, 500 * 2 ** attempt++);
    const delay = base / 2 + Math.random() * (base / 2);
    setTimeout(() => connect().catch(scheduleReconnect), delay);
  }

  connect().catch(scheduleReconnect);
  return {
    close() {
      stopped = true;
      socket?.close();
    },
  };
}
