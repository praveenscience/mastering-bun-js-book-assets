// Configuration from the environment, checked once (Chapter 11).
const env = process.env;

function int(name: string, fallback: number, min: number, max: number) {
  const value = env[name] === undefined ? fallback : Number(env[name]);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}`);
  }
  return value;
}

export function loadConfig() {
  return Object.freeze({
    host: env.HOST ?? "127.0.0.1",
    port: int("PORT", 8080, 0, 65535),
    dbPath: env.DB_PATH ?? "data/gateway.db",
    sinkUrl: env.SINK_URL ?? "",
    forwardBatch: int("FORWARD_BATCH", 1000, 1, 100_000),
    // 1: forward from a Worker thread (needs a database file).
    forwardWorker: int("FORWARD_WORKER", 1, 0, 1) === 1,
    maxBatch: int("MAX_BATCH", 2000, 1, 100_000),
    maxQueue: int("MAX_QUEUE", 50_000, 1, 10_000_000),
    flushMs: int("FLUSH_MS", 20, 1, 10_000),
    maxBodyBytes: int("MAX_BODY_BYTES", 1024 * 1024, 1024, 1 << 30),
    retentionDays: int("RETENTION_DAYS", 7, 1, 3650),
    drainSeconds: int("DRAIN_SECONDS", 5, 0, 120),
    logLevel: (env.LOG_LEVEL ?? "info") as "info",
  });
}
export type Config = ReturnType<typeof loadConfig>;
