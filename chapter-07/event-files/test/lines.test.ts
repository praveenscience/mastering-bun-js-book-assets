import { expect, test } from "bun:test";
import { readLines } from "../src/lines";

// Builds a stream that delivers the given byte chunks one by one.
const streamOf = (...chunks: Uint8Array[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(c));
      controller.close();
    },
  });

test("joins a line that is split across chunks", async () => {
  const enc = new TextEncoder();
  const stream = streamOf(
    enc.encode('{"a":1}\n{"b"'),
    enc.encode(":2}\n"),
  );
  expect(await Array.fromAsync(readLines(stream))).toEqual([
    '{"a":1}',
    '{"b":2}',
  ]);
});

test("keeps a character split across chunks", async () => {
  const bytes = new TextEncoder().encode("café\n"); // é is 2 bytes
  const stream = streamOf(bytes.slice(0, 4), bytes.slice(4));
  expect(await Array.fromAsync(readLines(stream))).toEqual(["café"]);
});

test("returns a last line without a newline", async () => {
  const stream = streamOf(new TextEncoder().encode("one\ntwo"));
  expect(await Array.fromAsync(readLines(stream))).toEqual([
    "one",
    "two",
  ]);
});
