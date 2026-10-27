// Starts the service, connects a WebSocket client, sends SIGTERM,
// and prints a timeline of what a load balancer and a client see.
const port = 3400;
const base = `http://127.0.0.1:${port}`;
const child = Bun.spawn(["bun", "src/main.ts"], {
  cwd: `${import.meta.dir}/..`,
  env: {
    ...process.env,
    PORT: String(port),
    API_TOKEN: "demo",
    DRAIN_SECONDS: "3",
    LOG_LEVEL: "warn",
  },
  stdout: "inherit",
});
await Bun.sleep(500);

const t0 = performance.now();
const at = () =>
  `${String(Math.round(performance.now() - t0)).padStart(5)} ms`;
const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?channel=orders`);
await new Promise((open) => (ws.onopen = open));
ws.onclose = (e) =>
  console.log(`${at()}  websocket closed: ${e.code} ${e.reason}`);

child.kill("SIGTERM");
console.log(`${at()}  SIGTERM sent`);
let last = "";
while (true) {
  let now: string;
  try {
    now = `readyz ${(await fetch(`${base}/readyz`)).status}`;
  } catch {
    now = "connection refused";
  }
  if (now !== last) console.log(`${at()}  ${now}`);
  last = now;
  if (now === "connection refused") break;
  await Bun.sleep(100);
}
console.log(`${at()}  process exited with code ${await child.exited}`);
