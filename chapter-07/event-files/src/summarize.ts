import { readLines } from "./lines";

export type Summary = {
  events: number;
  byType: Record<string, number>;
  slowest: number;
  badLines: number;
};

// Aggregates NDJSON events one line at a time.
export async function summarize(
  stream: ReadableStream<Uint8Array>,
): Promise<Summary> {
  const summary: Summary = {
    events: 0,
    byType: {},
    slowest: 0,
    badLines: 0,
  };
  for await (const line of readLines(stream)) {
    if (!line) continue;
    let event: { type?: unknown; ms?: unknown };
    try {
      event = JSON.parse(line);
    } catch {
      summary.badLines++; // count it and keep going
      continue;
    }
    const type =
      typeof event.type === "string" ? event.type : "unknown";
    summary.byType[type] = (summary.byType[type] ?? 0) + 1;
    if (typeof event.ms === "number" && event.ms > summary.slowest) {
      summary.slowest = event.ms;
    }
    summary.events++;
  }
  return summary;
}
