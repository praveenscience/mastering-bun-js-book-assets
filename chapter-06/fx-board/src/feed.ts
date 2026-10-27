import { PAIRS, type Rate } from "./protocol";

// Produces rates, numbers each one, and remembers the most recent
// ones so that reconnecting clients can catch up.
export function createFeed(historySize = 1000) {
  // Sequence numbers restart with the process, so each run gets an
  // epoch. A seq number only means something within its epoch.
  const epoch = crypto.randomUUID().slice(0, 8);
  let seq = 0;
  const history: Rate[] = [];
  const latest = new Map<string, Rate>();
  const listeners = new Set<(rate: Rate) => void>();
  const mids = new Map(
    PAIRS.map((p, i) => [p, [1.27, 1.08, 151, 0.85][i]!]),
  );

  function publish(pair: string, mid: number) {
    const spread = mid * 0.0001;
    const rate: Rate = {
      type: "rate",
      pair,
      bid: +(mid - spread).toFixed(5),
      ask: +(mid + spread).toFixed(5),
      seq: ++seq,
    };
    history.push(rate);
    if (history.length > historySize) history.shift();
    latest.set(pair, rate);
    for (const listener of listeners) listener(rate);
    return rate;
  }

  return {
    epoch,
    publish,
    // One random step per pair: a stand-in for a real market feed.
    tick() {
      for (const [pair, mid] of mids) {
        const next = mid * (1 + (Math.random() - 0.5) / 5000);
        mids.set(pair, next);
        publish(pair, next);
      }
    },
    // Rates after lastSeq, or null if they have left the history.
    since(lastSeq: number, pairs: string[]): Rate[] | null {
      const oldest = history[0]?.seq ?? seq + 1;
      if (lastSeq + 1 < oldest) return null;
      return history.filter(
        (r) => r.seq > lastSeq && pairs.includes(r.pair),
      );
    },
    snapshot(pairs: string[]) {
      return pairs.flatMap((p) => latest.get(p) ?? []);
    },
    onRate(listener: (rate: Rate) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type Feed = ReturnType<typeof createFeed>;
