// Two Bun services: "api" calls "store". With manual spans and
// context propagation, both requests land in one trace.
import { tracedFetch, tracedHandler } from "./traced";

const store = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: tracedHandler("/store", () => new Response("stored")),
});
const api = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: tracedHandler("/api", async () => {
    const res = await tracedFetch(`${store.url}save`, {
      method: "POST",
    });
    return new Response(`api -> ${await res.text()}`);
  }),
});

console.log(await (await fetch(api.url)).text());
api.stop();
store.stop();
