// Writes a heap snapshot when the process receives SIGUSR2, so a
// running service can be inspected without a restart. Open the file
// in Chrome DevTools (Memory tab, Load) or summarise it with
// scripts/heap-top.ts.
import { writeHeapSnapshot } from "node:v8";
import { join } from "node:path";
import type { Logger } from "./log";

export function enableHeapSnapshots(dir: string, log: Logger) {
  process.on("SIGUSR2", () => {
    const name = `heap-${process.pid}-${Date.now()}.heapsnapshot`;
    const file = join(dir, name);
    const started = performance.now();
    writeHeapSnapshot(file);
    log.info("heap snapshot written", {
      file,
      ms: Math.round(performance.now() - started),
    });
  });
}
