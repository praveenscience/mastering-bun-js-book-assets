// A long native call blocks the event loop; a Worker does not.
import { kernels } from "../src/native";

const [w, h] = [3840, 2160];
const bytes = w * h * 4;
let last = performance.now();
let worst = 0;
const timer = setInterval(() => {
  const now = performance.now();
  worst = Math.max(worst, now - last);
  last = now;
}, 5);

async function measure(label: string, work: () => Promise<void>) {
  await Bun.sleep(50);
  worst = 0;
  last = performance.now();
  await work();
  await Bun.sleep(20);
  console.log(`${label}: longest timer gap ${worst.toFixed(0)} ms`);
}

await measure("main thread", async () => {
  const src = new Uint8Array(bytes);
  const dst = new Uint8Array(bytes);
  for (let i = 0; i < 5; i++) {
    kernels.symbols.box_blur(src, dst, w, h, 8);
  }
});

await measure("worker", async () => {
  const url = new URL("./blur-worker.ts", import.meta.url);
  const worker = new Worker(url);
  const src = new Uint8Array(new SharedArrayBuffer(bytes));
  const dst = new Uint8Array(new SharedArrayBuffer(bytes));
  await new Promise((done) => {
    worker.onmessage = done;
    worker.postMessage({ src, dst, w, h });
  });
  worker.terminate();
});
clearInterval(timer);
