// Usage: bun load.ts <ws-url> <clients> <messages-per-client>
// Every client sends its messages; the server broadcasts each one to
// every client. We count the copies that arrive and time the run.
const [url, clientArg = "64", perArg = "20"] = process.argv.slice(2);
const clients = Number(clientArg);
const perClient = Number(perArg);
const expected = clients * clients * perClient; // copies in total

const latencies: number[] = [];
let delivered = 0;
let lastArrival = performance.now();

const sockets = await Promise.all(
  Array.from({ length: clients }, (_, i) => {
    const ws = new WebSocket(url!);
    ws.onmessage = (event) => {
      delivered++;
      lastArrival = performance.now();
      if (i === 0) {
        const sentAt = Number(String(event.data).split(":")[1]);
        latencies.push(lastArrival - sentAt);
      }
    };
    return new Promise<WebSocket>((r) => (ws.onopen = () => r(ws)));
  }),
);

const start = performance.now();
for (let m = 0; m < perClient; m++) {
  for (const ws of sockets) ws.send(`msg:${performance.now()}`);
  await Bun.sleep(0); // let the event loop breathe between rounds
}
// Wait until everything arrived, or nothing has arrived for 2 s.
while (delivered < expected && performance.now() - lastArrival < 2000) {
  await Bun.sleep(10);
}
const seconds = (lastArrival - start) / 1000;

latencies.sort((a, b) => a - b);
const pct = (p: number) =>
  latencies[Math.floor((latencies.length - 1) * p)]?.toFixed(1);
const share = ((delivered / expected) * 100).toFixed(1);
console.log(
  `${clients} clients: ${delivered} of ${expected} delivered`,
  `(${share}%) in ${seconds.toFixed(2)} s,`,
  `${Math.round(delivered / seconds)} msg/s,`,
  `latency p50 ${pct(0.5)} ms, p99 ${pct(0.99)} ms`,
);
sockets.forEach((ws) => ws.close());
