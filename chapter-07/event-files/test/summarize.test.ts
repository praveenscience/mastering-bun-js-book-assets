import { expect, test } from "bun:test";
import { summarize } from "../src/summarize";

test("counts events by type and survives bad lines", async () => {
  const ndjson = [
    '{"type":"view","ms":10}',
    '{"type":"click","ms":250}',
    "this is not JSON",
    '{"type":"view","ms":40}',
    "",
  ].join("\n");
  const summary = await summarize(new Blob([ndjson]).stream());
  expect(summary).toEqual({
    events: 3,
    byType: { view: 2, click: 1 },
    slowest: 250,
    badLines: 1,
  });
});
