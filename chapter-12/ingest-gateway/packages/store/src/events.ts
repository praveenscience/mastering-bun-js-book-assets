import type { Database } from "bun:sqlite";
import type { Event } from "@igw/protocol";

export type Stored = Event & { keyId: number };
export type Row = {
  seq: number;
  key_id: number;
  event_id: string;
  ts: number;
  type: string;
  user_id: string;
  ms: number | null;
  props: string | null;
};

export function createEventStore(db: Database) {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO events
       (key_id, event_id, received_at, ts, type, user_id, ms, props)
     VALUES ($key, $id, $now, $ts, $type, $user, $ms, $props)`,
  );
  const after = db.prepare(
    "SELECT * FROM events WHERE seq > $seq ORDER BY seq LIMIT $limit",
  );
  // Only events that are old enough AND already forwarded may go.
  const expire = db.prepare(
    `DELETE FROM events WHERE seq IN (SELECT seq FROM events
       WHERE received_at < $before AND seq <= $forwarded
       ORDER BY seq LIMIT $limit)`,
  );
  const counts = db.prepare(
    `SELECT COUNT(*) AS events, COALESCE(MAX(seq), 0) AS last
     FROM events`,
  );

  // Events per type in a time window: the (ts, type) index of
  // Chapter 8 keeps this a range scan.
  const byType = db.prepare(
    `SELECT type, COUNT(*) AS events FROM events
     WHERE ts >= $from AND ts < $to
     GROUP BY type ORDER BY events DESC, type`,
  );

  // One transaction per batch (Chapter 8). Returns how many events
  // were new; duplicates of stored ids are skipped.
  const insertBatch = db.transaction((events: Stored[]) => {
    const now = Date.now();
    let added = 0;
    for (const e of events) {
      added += insert.run({
        key: e.keyId,
        id: e.id,
        now,
        ts: e.ts,
        type: e.type,
        user: e.user,
        ms: e.ms ?? null,
        props: e.props ? JSON.stringify(e.props) : null,
      }).changes;
    }
    return added;
  });

  return {
    insertBatch,
    readAfter: (seq: number, limit: number) =>
      after.all({ seq, limit }) as Row[],
    // Deletes in small chunks so a large clean-up never holds the
    // write lock for long.
    expireBefore: (before: number, forwarded: number, limit = 5000) =>
      expire.run({ before, forwarded, limit }).changes,
    counts: () => counts.get() as { events: number; last: number },
    countByType: (from: number, to: number) =>
      byType.all({ from, to }) as { type: string; events: number }[],
  };
}

export type EventStore = ReturnType<typeof createEventStore>;
