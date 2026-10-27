// Collects accepted events in memory and writes them in batches.
// Memory is bounded: when the queue is full, add() refuses, and the
// caller must push back on the producer.
import type { Stored } from "@igw/store";

type Batch = {
  events: Stored[];
  done: Promise<number>;
  resolve: (added: number) => void;
  reject: (err: unknown) => void;
};

export type BatcherOptions = {
  write: (events: Stored[]) => number; // returns rows added
  maxBatch: number; // flush as soon as this many are queued
  maxQueue: number; // refuse new events beyond this
  flushMs: number; // otherwise flush this often
  onFlush?: (events: number, added: number, ms: number) => void;
};

export class Batcher {
  private open: Batch = this.newBatch();
  private timer: Timer | undefined;
  queued = 0;

  constructor(private o: BatcherOptions) {}

  private newBatch(): Batch {
    let resolve!: Batch["resolve"];
    let reject!: Batch["reject"];
    const done = new Promise<number>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    done.catch(() => {}); // callers that do not wait must not crash us
    return { events: [], done, resolve, reject };
  }

  // Queues events. Returns null if there is no room (backpressure),
  // otherwise a promise that settles when they are committed.
  add(events: Stored[]): Promise<number> | null {
    if (this.queued + events.length > this.o.maxQueue) return null;
    this.open.events.push(...events);
    this.queued += events.length;
    if (this.open.events.length >= this.o.maxBatch) {
      queueMicrotask(() => this.flush());
    } else {
      this.timer ??= setTimeout(() => this.flush(), this.o.flushMs);
    }
    return this.open.done;
  }

  // Writes everything queued so far, in chunks of maxBatch.
  flush() {
    clearTimeout(this.timer);
    this.timer = undefined;
    const batch = this.open;
    if (batch.events.length === 0) return;
    this.open = this.newBatch();
    const started = performance.now();
    try {
      let added = 0;
      for (let i = 0; i < batch.events.length; i += this.o.maxBatch) {
        added += this.o.write(
          batch.events.slice(i, i + this.o.maxBatch),
        );
      }
      this.o.onFlush?.(
        batch.events.length,
        added,
        performance.now() - started,
      );
      batch.resolve(added);
    } catch (err) {
      batch.reject(err);
    } finally {
      this.queued -= batch.events.length;
    }
  }
}
