// The same two hops with node:http, relying on auto-instrumentation.
// Run under Node.js:  node --require ./auto.cjs demo-auto.cjs
// and under Bun:      bun --preload ./auto.cjs demo-auto.cjs
const http = require("node:http");

const store = http.createServer((req, res) => res.end("stored"));
const api = http.createServer(async (req, res) => {
  const reply = await fetch("http://127.0.0.1:4500/", {
    method: "POST",
  });
  res.end(`api -> ${await reply.text()}`);
});
store.listen(4500, "127.0.0.1", () =>
  api.listen(4501, "127.0.0.1", async () => {
    console.log(await (await fetch("http://127.0.0.1:4501/")).text());
    setTimeout(() => process.exit(0), 1000);
  }),
);
