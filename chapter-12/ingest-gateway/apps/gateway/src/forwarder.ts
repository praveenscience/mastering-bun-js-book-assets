// The outbox pattern: events are committed locally first, and this
// loop ships everything after the saved cursor to the sink. Delivery
// is at least once; the sink de-duplicates by key and event id.
import type { Row, Store } from "@igw/store";
import type { Logger } from "./log";

export type ForwarderOptions = {
  store: Store;
  url: string;
  batch?: number;
  name?: string;
  log: Logger;
  onSent?: (events: number) => void;
  onError?: () => void;
};

const toWire = (r: Row) =>
  JSON.stringify({
    key: r.key_id,
    id: r.event_id,
    ts: r.ts,
    type: r.type,
    user: r.user_id,
    ...(r.ms === null ? {} : { ms: r.ms }),
    ...(r.props === null ? {} : { props: JSON.parse(r.props) }),
  });

export class Forwarder {
  private stopped = false;
  private backoff = 0;
  private name: string;
  private loop: Promise<void> | undefined;

  constructor(private o: ForwarderOptions) {
    this.name = o.name ?? "sink";
  }

  get cursor() {
    return this.o.store.cursors.get(this.name);
  }

  // Events stored but not yet delivered.
  get lag() {
    return this.o.store.events.counts().last - this.cursor;
  }

  start() {
    this.loop ??= this.run();
  }

  async stop() {
    this.stopped = true;
    await this.loop;
  }

  private async run() {
    while (!this.stopped) {
      const sent = await this.once();
      if (sent === 0 && !this.stopped) await Bun.sleep(100);
    }
  }

  // Sends one batch. Returns how many events were delivered.
  async once(): Promise<number> {
    const rows = this.o.store.events.readAfter(
      this.cursor,
      this.o.batch ?? 1000,
    );
    if (rows.length === 0) return 0;
    try {
      const res = await fetch(this.o.url, {
        method: "POST",
        headers: { "content-type": "application/x-ndjson" },
        body: rows.map(toWire).join("\n") + "\n",
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`sink answered ${res.status}`);
      this.o.store.cursors.set(this.name, rows.at(-1)!.seq);
      this.backoff = 0;
      this.o.onSent?.(rows.length);
      return rows.length;
    } catch (err) {
      // Exponential backoff with jitter, as for WebSocket clients.
      this.backoff = Math.min(30_000, Math.max(250, this.backoff * 2));
      const wait = this.backoff * (0.5 + Math.random() / 2);
      this.o.onError?.();
      this.o.log.warn("forward failed", {
        error: (err as Error).message,
        retryInMs: Math.round(wait),
      });
      if (!this.stopped) await Bun.sleep(wait);
      return 0;
    }
  }
}
