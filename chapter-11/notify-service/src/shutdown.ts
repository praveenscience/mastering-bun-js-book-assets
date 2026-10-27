// Graceful shutdown for a rolling deployment:
// 1. report not ready, so the load balancer stops sending traffic
// 2. wait for it to notice
// 3. ask WebSocket clients to reconnect, which takes them elsewhere
// 4. stop accepting connections and let in-flight requests finish
import type { Server, ServerWebSocket } from "bun";
import type { Logger } from "./log";

type Options = {
  server: Server<any>;
  state: { ready: boolean };
  sockets: Set<ServerWebSocket<any>>;
  log: Logger;
  drainSeconds: number;
  timeoutSeconds: number;
};

export async function shutdown(o: Options, reason: string) {
  const started = performance.now();
  const since = () => Math.round(performance.now() - started);
  o.log.info("shutdown: not ready", { reason });
  o.state.ready = false;
  await Bun.sleep(o.drainSeconds * 1000);

  o.log.info("shutdown: closing websockets", {
    count: o.sockets.size,
    ms: since(),
  });
  for (const ws of o.sockets) ws.close(1012, "service restart");

  const stopped = o.server.stop().then(() => "drained");
  const timeout = Bun.sleep(o.timeoutSeconds * 1000).then(
    () => "timed out",
  );
  const result = await Promise.race([stopped, timeout]);
  o.log.info("shutdown: done", {
    result,
    pendingRequests: o.server.pendingRequests,
    ms: since(),
  });
  return result;
}
