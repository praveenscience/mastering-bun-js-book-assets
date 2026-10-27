import { createFeed } from "../src/feed";
import { startServer, type Options } from "../src/server";

export function startTestApp(extra: Partial<Options> = {}) {
  const feed = createFeed(extra.feed ? undefined : 50);
  const app = startServer({
    feed,
    tokens: new Map([["token-ann", "ann"]]),
    allowedOrigins: ["https://fx.example.com"],
    ...extra,
  });
  return { ...app, feed, base: app.server.url.href.replace(/\/$/, "") };
}

export async function ticketFor(base: string, token = "token-ann") {
  const res = await fetch(`${base}/tickets`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  return ((await res.json()) as { ticket: string }).ticket;
}

// Opens a socket and collects everything it receives.
export async function openSocket(base: string, ticket?: string) {
  ticket ??= await ticketFor(base);
  const ws = new WebSocket(
    `${base.replace("http", "ws")}/ws?ticket=${ticket}`,
  );
  const inbox: any[] = [];
  const waiters: (() => void)[] = [];
  ws.onmessage = (e) => {
    inbox.push(JSON.parse(String(e.data)));
    waiters.splice(0).forEach((wake) => wake());
  };
  const closed = new Promise<CloseEvent>((r) => (ws.onclose = r));
  await new Promise((r) => (ws.onopen = r));
  // Resolves with the first message (old or new) that matches.
  async function next(match: (m: any) => boolean) {
    for (;;) {
      const i = inbox.findIndex(match);
      if (i >= 0) return inbox.splice(i, 1)[0];
      await new Promise<void>((r) => waiters.push(r));
    }
  }
  const send = (msg: unknown) => ws.send(JSON.stringify(msg));
  return { ws, inbox, next, send, closed };
}
