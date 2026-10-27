// Twelve-factor configuration: everything comes from the
// environment, is checked once at startup, and is then frozen.
import { readFileSync } from "node:fs";

export type Config = Readonly<{
  port: number;
  hostname: string;
  logLevel: "debug" | "info" | "warn" | "error";
  drainSeconds: number;
  shutdownTimeoutSeconds: number;
  apiToken: string;
  maxRecentEvents: number;
}>;

// A secret comes from NAME, or from the file named by NAME_FILE,
// which is how Docker and Kubernetes mount secrets.
export function secret(
  env: Record<string, string | undefined>,
  name: string,
): string {
  const file = env[`${name}_FILE`];
  const value = file ? readFileSync(file, "utf8").trim() : env[name];
  if (!value) throw new Error(`missing secret ${name}`);
  return value;
}

function int(
  env: Record<string, string | undefined>,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}`);
  }
  return value;
}

export function loadConfig(env = process.env): Config {
  const logLevel = env.LOG_LEVEL ?? "info";
  if (!["debug", "info", "warn", "error"].includes(logLevel)) {
    throw new Error("LOG_LEVEL must be debug, info, warn or error");
  }
  return Object.freeze({
    port: int(env, "PORT", 3000, 0, 65535),
    hostname: env.HOST ?? "127.0.0.1",
    logLevel: logLevel as Config["logLevel"],
    drainSeconds: int(env, "DRAIN_SECONDS", 5, 0, 120),
    shutdownTimeoutSeconds: int(
      env,
      "SHUTDOWN_TIMEOUT_SECONDS",
      20,
      1,
      600,
    ),
    apiToken: secret(env, "API_TOKEN"),
    maxRecentEvents: int(env, "MAX_RECENT_EVENTS", 1000, 1, 1_000_000),
  });
}
