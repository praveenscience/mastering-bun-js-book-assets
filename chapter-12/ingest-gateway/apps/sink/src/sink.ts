// A stand-in for a downstream warehouse. It de-duplicates by key and
// event id, as a real sink must under at-least-once delivery, and
// can be told to fail, to exercise the gateway's retries.
export function createSink() {
  const seen = new Set<string>();
  const stats = { requests: 0, received: 0, unique: 0, failed: 0 };
  let downUntil = 0;

  async function ingest(req: Request) {
    stats.requests++;
    if (Date.now() < downUntil) {
      stats.failed++;
      return new Response("unavailable", { status: 503 });
    }
    const text = await req.text();
    for (const line of text.split("\n")) {
      if (!line) continue;
      const e = JSON.parse(line) as { key: number; id: string };
      stats.received++;
      const id = `${e.key}:${e.id}`;
      if (!seen.has(id)) {
        seen.add(id);
        stats.unique++;
      }
    }
    return new Response(null, { status: 204 });
  }

  return {
    stats,
    routes: {
      "/ingest": { POST: ingest },
      "/stats": () => Response.json(stats),
      // POST /outage?seconds=10 makes the sink fail for a while.
      "/outage": {
        POST: (req: Request) => {
          const s = Number(
            new URL(req.url).searchParams.get("seconds"),
          );
          downUntil = Date.now() + (s || 10) * 1000;
          return Response.json({ downUntil });
        },
      },
    },
  };
}
