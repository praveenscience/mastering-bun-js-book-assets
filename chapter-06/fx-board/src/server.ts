import type { Feed } from "./feed";
import { createBucket, createConnectionCounter } from "./limits";
import { parseClientMessage, type ServerMessage } from "./protocol";
import { createTickets } from "./tickets";

export type Options = {
  feed: Feed;
  tokens: Map<string, string>; // API token -> user
  allowedOrigins: string[];
  port?: number;
  maxConnectionsPerUser?: number;
  homepage?: Bun.HTMLBundle; // an imported .html file
};

type SocketData = {
  user: string;
  allow: () => boolean; // rate limiter for this socket
};

const send = (ws: { send(s: string): number }, msg: ServerMessage) =>
  ws.send(JSON.stringify(msg));

export function startServer(opts: Options) {
  const tickets = createTickets();
  const connections = createConnectionCounter(
    opts.maxConnectionsPerUser ?? 5,
  );
  let ready = true;

  const server = Bun.serve({
    port: opts.port ?? 0,
    hostname: "127.0.0.1",
    // Development mode adds hot reloading and detailed error pages.
    development: process.env.NODE_ENV !== "production",
    routes: {
      "/": opts.homepage ?? new Response("FX board"),
      "/livez": new Response("ok"),
      "/readyz": () =>
        ready
          ? new Response("ready")
          : new Response("draining", { status: 503 }),
      "/events": (req, server) => {
        const pairs = new URL(req.url).searchParams
          .get("pairs")
          ?.split(",");
        const msg = parseClientMessage(
          JSON.stringify({ type: "subscribe", pairs }),
        );
        if (typeof msg === "string") {
          return new Response(msg, { status: 400 });
        }
        server.timeout(req, 0); // a quiet stream is not an idle one
        let stop = () => {};
        const stream = new ReadableStream({
          start(controller) {
            // A comment line sends the headers to the client at once.
            controller.enqueue(": connected\n\n");
            stop = opts.feed.onRate((rate) => {
              if (!msg.pairs.includes(rate.pair)) return;
              const data = JSON.stringify(rate);
              controller.enqueue(`id: ${rate.seq}\ndata: ${data}\n\n`);
            });
          },
          cancel: () => stop(), // the client went away
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
      "/tickets": {
        POST: (req) => {
          const auth = req.headers.get("authorization") ?? "";
          const user = opts.tokens.get(auth.replace(/^Bearer /, ""));
          if (!user) {
            return new Response("Unauthorized", { status: 401 });
          }
          return Response.json({ ticket: tickets.issue(user) });
        },
      },
      "/ws": (req, server) => {
        const origin = req.headers.get("origin");
        if (origin && !opts.allowedOrigins.includes(origin)) {
          return new Response("Forbidden origin", { status: 403 });
        }
        const url = new URL(req.url);
        const user = tickets.redeem(url.searchParams.get("ticket"));
        if (!user) return new Response("Bad ticket", { status: 401 });
        if (!connections.tryOpen(user)) {
          return new Response("Too many connections", { status: 429 });
        }
        const data: SocketData = { user, allow: createBucket(10, 20) };
        if (server.upgrade(req, { data })) return;
        connections.close(user);
        return new Response("Upgrade failed", { status: 400 });
      },
    },
    websocket: {
      data: {} as SocketData,
      maxPayloadLength: 4 * 1024,
      backpressureLimit: 1024 * 1024,
      closeOnBackpressureLimit: true,
      idleTimeout: 60,
      open(ws) {
        const { epoch } = opts.feed;
        send(ws, { type: "welcome", user: ws.data.user, epoch });
      },
      message(ws, raw) {
        if (!ws.data.allow()) {
          ws.close(1008, "Rate limit exceeded");
          return;
        }
        const msg = parseClientMessage(raw);
        if (typeof msg === "string") {
          send(ws, { type: "error", message: msg });
          return;
        }
        for (const pair of msg.pairs) {
          const topic = `rate:${pair}`;
          if (msg.type === "unsubscribe") ws.unsubscribe(topic);
          else ws.subscribe(topic);
        }
        if (msg.type === "resume") {
          const sameRun = msg.epoch === opts.feed.epoch;
          const missed =
            sameRun && opts.feed.since(msg.lastSeq, msg.pairs);
          if (missed) {
            for (const rate of missed) send(ws, rate);
          } else {
            const rates = opts.feed.snapshot(msg.pairs);
            send(ws, { type: "snapshot", rates });
          }
        }
      },
      close(ws) {
        connections.close(ws.data.user);
      },
    },
  });

  const stopFeed = opts.feed.onRate((rate) => {
    server.publish(`rate:${rate.pair}`, JSON.stringify(rate), false);
  });

  return {
    server,
    // Graceful shutdown: fail the readiness check so the load
    // balancer stops sending new clients, give it time to notice,
    // then close every socket with 1001 ("going away").
    async shutdown(drainMs = 0) {
      ready = false;
      await Bun.sleep(drainMs);
      stopFeed();
      await server.stop(true);
    },
  };
}
