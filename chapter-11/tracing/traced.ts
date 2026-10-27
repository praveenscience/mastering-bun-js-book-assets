// Manual tracing helpers for Bun.serve and fetch.
import {
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";

const tracer = trace.getTracer("notify");

// Wraps a fetch handler: continues the caller's trace from the
// traceparent header and records one server span per request.
export function tracedHandler(
  name: string,
  handler: (req: Request) => Promise<Response> | Response,
) {
  return (req: Request) => {
    const carrier = Object.fromEntries(req.headers);
    const parent = propagation.extract(context.active(), carrier);
    return tracer.startActiveSpan(
      `${req.method} ${name}`,
      { kind: SpanKind.SERVER },
      parent,
      async (span) => {
        try {
          const res = await handler(req);
          span.setAttribute("http.response.status_code", res.status);
          return res;
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          span.end();
        }
      },
    );
  };
}

// fetch with a client span and a traceparent header.
export function tracedFetch(url: string, init: RequestInit = {}) {
  return tracer.startActiveSpan(
    `${init.method ?? "GET"} ${new URL(url).host}`,
    { kind: SpanKind.CLIENT },
    async (span) => {
      const headers = new Headers(init.headers);
      propagation.inject(context.active(), headers, {
        set: (h, k, v) => h.set(k, v),
      });
      try {
        return await fetch(url, { ...init, headers });
      } finally {
        span.end();
      }
    },
  );
}
