// A strangler-fig router: each request goes to the legacy service
// unless a route sends a share of its traffic to a new backend.
import type { Config } from "./config";

export type Stats = Record<string, number>;

// The same client always lands on the same side of the split.
export function bucket(key: string): number {
  return Number(Bun.hash(key) % 100n);
}

export function choose(config: Config, req: Request): string {
  const url = new URL(req.url);
  const route = config.routes.find((r) =>
    url.pathname.startsWith(r.prefix),
  );
  if (!route) return "legacy";
  const pinned = req.headers.get("x-backend");
  if (pinned === "legacy" || pinned === route.backend) return pinned;
  const key =
    req.headers.get("authorization") ??
    req.headers.get("x-forwarded-for") ??
    url.pathname;
  return bucket(key) < route.percent ? route.backend : "legacy";
}

const HOP_BY_HOP = ["connection", "keep-alive", "transfer-encoding"];

export async function forward(base: string, req: Request) {
  const url = new URL(req.url);
  const headers = new Headers(req.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);
  return fetch(base + url.pathname + url.search, {
    method: req.method,
    headers,
    body: req.body,
    redirect: "manual",
  });
}
