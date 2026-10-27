import type { Database } from "bun:sqlite";
import { registerFunctions } from "./functions";

export type NewEvent = {
  ts: number;
  type: string;
  userId: string;
  ms: number;
  payload?: unknown;
};

export class EventRow {
  id!: number;
  ts!: number;
  type!: string;
  user_id!: string;
  ms!: number;
  payload!: string | null;

  get at() {
    return new Date(this.ts);
  }
}

export function createRepo(db: Database) {
  registerFunctions(db);
  const insertEvent = db.prepare(
    `INSERT INTO events (ts, type, user_id, ms, payload)
     VALUES ($ts, $type, $userId, $ms, $payload)`,
  );
  const touchUser = db.prepare(
    `INSERT INTO users (id, first_seen, events) VALUES ($id, $ts, 1)
     ON CONFLICT (id) DO UPDATE SET events = events + 1`,
  );
  const byId = db
    .prepare("SELECT * FROM events WHERE id = ?")
    .as(EventRow);
  const countByType = db.prepare(
    `SELECT type, COUNT(*) AS n FROM events
     WHERE ts >= $from AND ts < $to
     GROUP BY type ORDER BY n DESC, type`,
  );
  const latency = db.prepare(
    `SELECT type, COUNT(*) AS n, p95(ms) AS p95 FROM events
     WHERE ts >= $from AND ts < $to GROUP BY type ORDER BY type`,
  );
  const topUsers = db.prepare(
    "SELECT id, events FROM users ORDER BY events DESC LIMIT $limit",
  );

  // One transaction for the whole batch: all rows or none.
  const insertMany = db.transaction((events: NewEvent[]) => {
    for (const e of events) {
      insertEvent.run({
        ts: e.ts,
        type: e.type,
        userId: e.userId,
        ms: e.ms,
        payload:
          e.payload === undefined ? null : JSON.stringify(e.payload),
      });
      touchUser.run({ id: e.userId, ts: e.ts });
    }
    return events.length;
  });

  return {
    insertMany,
    find: (id: number) => byId.get(id),
    countByType: (from: number, to: number) =>
      countByType.all({ from, to }) as { type: string; n: number }[],
    latency: (from: number, to: number) =>
      latency.all({ from, to }) as {
        type: string;
        n: number;
        p95: number;
      }[],
    topUsers: (limit = 10) =>
      topUsers.all({ limit }) as { id: string; events: number }[],
  };
}

export type Repo = ReturnType<typeof createRepo>;
