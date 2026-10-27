import { runSlow } from "./slow-query";

// A timer that should fire every 10 ms, and reports when it is late.
let last = performance.now();
let worst = 0;
const timer = setInterval(() => {
  const now = performance.now();
  worst = Math.max(worst, now - last - 10);
  last = now;
}, 10);

async function report(label: string, work: () => Promise<unknown>) {
  worst = 0;
  last = performance.now();
  const start = performance.now();
  await work();
  await Bun.sleep(30); // let the timer catch up
  const took = (performance.now() - start - 30).toFixed(0);
  console.log(
    `${label}: query ${took} ms, timer late by ${worst.toFixed(0)} ms`,
  );
}

// 1. On the main thread: nothing else runs until the query ends.
await report("main thread", async () => runSlow());

// 2. In a worker thread: the main thread stays responsive.
await report("worker", () => {
  const worker = new Worker(
    new URL("./slow-worker.ts", import.meta.url),
  );
  return new Promise((done) => {
    worker.onmessage = (event) => {
      worker.terminate();
      done(event.data);
    };
  });
});
clearInterval(timer);
