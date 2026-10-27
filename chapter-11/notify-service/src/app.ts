// The notify service: clients subscribe to a channel over a
// WebSocket, and producers POST events that are pushed to every
// subscriber of that channel.
import type { Server, ServerWebSocket } from "bun";
import type { AuthCheck } from "./auth";
import type { Config } from "./config";
import type { Dedupe } from "./dedupe";
import type { Logger } from "./log";
import { Metrics } from "./metrics";

type Socket = ServerWebSocket<{ channel: string }>;
export type Deps = {
  config: Config;
  log: Logger;
  auth: AuthCheck;
  dedupe: Dedupe;
  metrics?: Metrics;
};

const CHANNEL = /^[a-z0-9-]{1,64}$/;

export function createApp(deps: Deps) {
  const { log, auth, dedupe } = deps;
  const metrics = deps.metrics ?? new Metrics();
  const state = { ready: true };
  const sockets = new Set<Socket>();
  let server: Server<{ channel: string }> | undefined;

  async function publish(req: Request) {
    if (!(await auth(req.headers.get("authorization")))) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const { id, channel, message } = body ?? {};
    if (
      typeof id !== "string" ||
      id.length > 128 ||
      typeof channel !== "string" ||
      !CHANNEL.test(channel) ||
      typeof message !== "string" ||
      message.length > 4096
    ) {
      return Response.json({ error: "invalid event" }, { status: 400 });
    }
    if (dedupe.seen(id)) {
      metrics.inc("notify_events_total", { result: "duplicate" });
      return Response.json({ id, duplicate: true });
    }
    const event = JSON.stringify({ type: "event", id, message });
    const delivered = server?.subscriberCount(channel) ?? 0;
    server?.publish(channel, event);
    metrics.inc("notify_events_total", { result: "published" });
    return Response.json({ id, delivered }, { status: 202 });
  }

  function timed(
    route: string,
    handler: (req: Request) => Response | Promise<Response>,
  ) {
    return async (req: Request) => {
      const start = performance.now();
      const res = await handler(req);
      const status = String(res.status);
      metrics.observe(
        "http_request_duration_seconds",
        { route, status },
        (performance.now() - start) / 1000,
      );
      return res;
    };
  }

  const routes = {
    "/healthz": () => Response.json({ ok: true }),
    "/readyz": () =>
      state.ready
        ? Response.json({ ready: true })
        : Response.json({ ready: false }, { status: 503 }),
    "/metrics": () =>
      new Response(metrics.render(), {
        headers: { "content-type": "text/plain; version=0.0.4" },
      }),
    "/events": { POST: timed("/events", publish) },
    "/ws": (req: Request) => {
      const channel = new URL(req.url).searchParams.get("channel");
      if (!channel || !CHANNEL.test(channel)) {
        return Response.json({ error: "bad channel" }, { status: 400 });
      }
      if (server?.upgrade(req, { data: { channel } })) return;
      return new Response("upgrade required", { status: 426 });
    },
  };

  const websocket = {
    open(ws: Socket) {
      sockets.add(ws);
      ws.subscribe(ws.data.channel);
      metrics.inc("notify_ws_connections_total");
    },
    message() {},
    close(ws: Socket) {
      sockets.delete(ws);
    },
  };

  metrics.gauges.notify_dedupe_ids = () => dedupe.size;
  metrics.gauges.bun_pending_requests = () =>
    server?.pendingRequests ?? 0;
  metrics.gauges.bun_pending_websockets = () =>
    server?.pendingWebSockets ?? 0;

  return {
    routes,
    websocket,
    state,
    sockets,
    metrics,
    attach(s: Server<{ channel: string }>) {
      server = s;
      log.debug("attached", { port: s.port });
    },
  };
}
