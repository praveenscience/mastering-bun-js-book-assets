import { expect, test } from "bun:test";
import { parseClientMessage } from "../src/protocol";

test("accepts a subscribe message", () => {
  const raw = JSON.stringify({ type: "subscribe", pairs: ["GBPUSD"] });
  expect(parseClientMessage(raw)).toEqual({
    type: "subscribe",
    pairs: ["GBPUSD"],
  });
});

test.each([
  ["binary frame", new Uint8Array([1]), "text frames"],
  ["broken JSON", "{type:", "Not JSON"],
  ["unknown pair", '{"type":"subscribe","pairs":["BTC"]}', "pairs"],
  ["unknown type", '{"type":"delete","pairs":[]}', "Unknown type"],
  [
    "bad lastSeq",
    '{"type":"resume","pairs":[],"lastSeq":-1}',
    "lastSeq",
  ],
  ["no epoch", '{"type":"resume","pairs":[],"lastSeq":1}', "epoch"],
])("rejects %s", (_name, raw, message) => {
  expect(parseClientMessage(raw)).toContain(message);
});
