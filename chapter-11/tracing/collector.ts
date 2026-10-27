// A stand-in for an OpenTelemetry collector: accepts OTLP/HTTP JSON
// on port 4318 and prints one line per span.
Bun.serve({
  hostname: "127.0.0.1",
  port: 4318,
  async fetch(req) {
    const body = await req.json().catch(() => ({}));
    for (const rs of body.resourceSpans ?? []) {
      for (const ss of rs.scopeSpans) {
        for (const s of ss.spans) {
          const parent = (s.parentSpanId || "root").slice(0, 8);
          const ids =
            `trace ${s.traceId.slice(0, 8)}  span ` +
            `${s.spanId.slice(0, 8)}  parent ${parent.padEnd(8)}`;
          console.log(`${ids}  ${s.name}`);
        }
      }
    }
    return Response.json({});
  },
});
console.log("collector listening on :4318");
