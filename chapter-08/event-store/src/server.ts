import type { NewEvent, Repo } from "./repo";

const MAX_BATCH = 1_000;

// Validates one event from a client, or returns a reason.
function check(raw: unknown): NewEvent | string {
  const e = raw as Record<string, unknown>;
  if (typeof e !== "object" || e === null) return "not an object";
  if (!Number.isInteger(e.ts)) return "ts must be an integer";
  if (typeof e.type !== "string" || !/^[a-z_]{1,32}$/.test(e.type)) {
    return "type must be 1 to 32 lowercase letters";
  }
  if (typeof e.userId !== "string" || e.userId.length > 64) {
    return "userId must be a short string";
  }
  if (!Number.isInteger(e.ms) || (e.ms as number) < 0) {
    return "ms must be a whole number of milliseconds";
  }
  return e as unknown as NewEvent;
}

// The repository is passed in, so tests can use an in-memory one.
export function startServer(repo: Repo, port = 0) {
  return Bun.serve({
    port,
    hostname: "127.0.0.1",
    routes: {
      "/events": {
        POST: async (req) => {
          const body = await req.json().catch(() => null);
          if (!Array.isArray(body) || body.length > MAX_BATCH) {
            return Response.json(
              { error: `Send an array of 1 to ${MAX_BATCH} events` },
              { status: 400 },
            );
          }
          const events: NewEvent[] = [];
          for (const [i, raw] of body.entries()) {
            const event = check(raw);
            if (typeof event === "string") {
              return Response.json(
                { error: `event ${i}: ${event}` },
                { status: 400 },
              );
            }
            events.push(event);
          }
          return Response.json(
            { stored: repo.insertMany(events) },
            { status: 201 },
          );
        },
      },
      "/stats": (req) => {
        const url = new URL(req.url);
        const from = Number(url.searchParams.get("from") ?? 0);
        const to = Number(url.searchParams.get("to") ?? Date.now());
        return Response.json(repo.countByType(from, to));
      },
      "/users/top": () => Response.json(repo.topUsers(10)),
    },
  });
}
