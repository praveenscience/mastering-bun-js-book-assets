// A producer for the gateway: validates events with the same rules,
// sends them in batches, and retries what was not acknowledged,
// honoring Retry-After. Event ids make every retry safe.
import { validate, type Event } from "@igw/protocol";

export type ClientOptions = {
  url: string;
  key: string;
  batchSize?: number; // send when this many are waiting
  flushMs?: number; // or after this long
  maxAttempts?: number;
};

export class IngestClient {
  private queue: Event[] = [];
  private timer: Timer | undefined;
  private sending: Promise<void> = Promise.resolve();
  readonly stats = { sent: 0, retries: 0, rejected: 0, failed: 0 };

  constructor(private o: ClientOptions) {}

  // Queues one event; throws at once if the gateway would reject it.
  add(event: Event) {
    const verdict = validate(event);
    if (!verdict.ok) throw new Error(verdict.error);
    this.queue.push(verdict.event);
    if (this.queue.length >= (this.o.batchSize ?? 500)) this.flush();
    else
      this.timer ??= setTimeout(
        () => this.flush(),
        this.o.flushMs ?? 200,
      );
  }

  // Sends everything queued; resolves when it has been acknowledged.
  flush(): Promise<void> {
    clearTimeout(this.timer);
    this.timer = undefined;
    const batch = this.queue.splice(0);
    if (batch.length === 0) return this.sending;
    // One request at a time keeps ordering simple and load gentle.
    this.sending = this.sending.then(() => this.send(batch));
    return this.sending;
  }

  private async send(batch: Event[]) {
    const max = this.o.maxAttempts ?? 8;
    for (let attempt = 1; attempt <= max; attempt++) {
      let wait = 0;
      try {
        const res = await fetch(`${this.o.url}/v1/events`, {
          method: "POST",
          headers: { authorization: `Bearer ${this.o.key}` },
          body: JSON.stringify(batch),
        });
        if (res.ok) {
          const body = await res.json();
          this.stats.sent += body.accepted;
          this.stats.rejected += body.rejected.length;
          return;
        }
        if (res.status !== 429 && res.status !== 503) {
          throw new Error(`gateway answered ${res.status}`); // no retry
        }
        wait = Number(res.headers.get("retry-after") ?? 1) * 1000;
      } catch (err) {
        if ((err as Error).message.startsWith("gateway answered")) {
          this.stats.failed += batch.length;
          throw err;
        }
      }
      // Network error or "try later": back off with jitter.
      this.stats.retries++;
      const backoff = Math.min(30_000, 100 * 2 ** attempt);
      await Bun.sleep(
        Math.max(wait, backoff * (0.5 + Math.random() / 2)),
      );
    }
    this.stats.failed += batch.length;
    throw new Error(`gave up after ${max} attempts`);
  }
}
