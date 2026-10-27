import { createSink } from "./sink";

const sink = createSink();
const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 8090),
  routes: sink.routes,
  fetch: () => new Response("not found", { status: 404 }),
});
console.log(`sink on :${server.port}`);
