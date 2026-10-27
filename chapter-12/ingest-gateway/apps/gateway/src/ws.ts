// WebSockets: producers stream events on /v1/stream and get an ack
// per message; subscribers watch stored events live on /v1/tail.
import type { Server, ServerWebSocket } from "bun";
import type { ApiKey } from "@igw/store";
import { accept } from "./accept";
import { authenticate, MAX_EVENTS_PER_REQUEST, type Deps } from "./app";

type Data =
  | { role: "producer"; key: ApiKey }
  | { role: "tail"; key: ApiKey; type: string };
export type GatewaySocket = ServerWebSocket<Data>;
type Message = { ref?: unknown; events?: unknown };

export function createSockets(d: Deps) {
  const sockets = new Set<GatewaySocket>();

  // Upgrades only authenticated requests; the key travels in the
  // Authorization header, never in the URL, where it would be logged.
  function upgrade(req: Request, server: Server<Data>) {
    const key = authenticate(d.store, req);
    if (!key)
      return Response.json(
        { error: "invalid API key" },
        { status: 401 },
      );
    const url = new URL(req.url);
    const data: Data =
      url.pathname === "/v1/tail"
        ? {
            role: "tail",
            key,
            type: url.searchParams.get("type") ?? "*",
          }
        : { role: "producer", key };
    if (server.upgrade(req, { data })) return undefined;
    return new Response("upgrade required", { status: 426 });
  }

  async function onMessage(ws: GatewaySocket, raw: string | Buffer) {
    if (ws.data.role !== "producer") return;
    const reply = (m: Record<string, unknown>) => {
      ws.send(JSON.stringify(m));
    };
    let msg: Message;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return reply({ type: "error", error: "bad JSON" });
    }
    const { ref } = msg;
    const items = Array.isArray(msg.events) ? msg.events : [msg.events];
    if (items.length > MAX_EVENTS_PER_REQUEST) {
      return reply({ type: "nack", ref, reason: "too many events" });
    }
    const wait = d.limiter.take(ws.data.key, items.length);
    if (wait > 0) {
      return reply({
        type: "nack",
        ref,
        reason: "rate limit",
        retryAfterMs: wait,
      });
    }
    const { events, rejected } = accept(items, ws.data.key.id);
    const committed = d.batcher.add(events);
    if (!committed) {
      return reply({
        type: "nack",
        ref,
        reason: "busy",
        retryAfterMs: 1000,
      });
    }
    try {
      await committed;
      reply({ type: "ack", ref, accepted: events.length, rejected });
    } catch {
      reply({ type: "nack", ref, reason: "storage" });
    }
  }

  const websocket = {
    open(ws: GatewaySocket) {
      sockets.add(ws);
      if (ws.data.role === "tail") ws.subscribe(`type:${ws.data.type}`);
    },
    message: onMessage,
    close(ws: GatewaySocket) {
      sockets.delete(ws);
    },
  };
  return { upgrade, websocket, sockets };
}
