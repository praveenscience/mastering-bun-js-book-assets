// Every message is JSON with a "type" field, so any language can
// read it with an ordinary JSON parser and a switch statement.
export const PAIRS = ["GBPUSD", "EURUSD", "USDJPY", "EURGBP"];

export type ClientMessage =
  | { type: "subscribe"; pairs: string[] }
  | { type: "unsubscribe"; pairs: string[] }
  | { type: "resume"; pairs: string[]; lastSeq: number; epoch: string };

export type Rate = {
  type: "rate";
  pair: string;
  bid: number;
  ask: number;
  seq: number;
};

export type ServerMessage =
  | { type: "welcome"; user: string; epoch: string }
  | Rate
  | { type: "snapshot"; rates: Rate[] }
  | { type: "error"; message: string };

// Returns a valid message, or a string saying what is wrong.
export function parseClientMessage(
  raw: unknown,
): ClientMessage | string {
  if (typeof raw !== "string") return "Send text frames";
  let msg: any;
  try {
    msg = JSON.parse(raw);
  } catch {
    return "Not JSON";
  }
  if (typeof msg !== "object" || msg === null) return "Not an object";
  const pairs = msg.pairs;
  if (
    !Array.isArray(pairs) ||
    pairs.length > PAIRS.length ||
    !pairs.every((p) => PAIRS.includes(p))
  ) {
    return `pairs must be a list drawn from ${PAIRS.join(", ")}`;
  }
  switch (msg.type) {
    case "subscribe":
    case "unsubscribe":
      return { type: msg.type, pairs };
    case "resume":
      if (!Number.isInteger(msg.lastSeq) || msg.lastSeq < 0) {
        return "lastSeq must be a whole number";
      }
      if (typeof msg.epoch !== "string") return "epoch is required";
      return {
        type: "resume",
        pairs,
        lastSeq: msg.lastSeq,
        epoch: msg.epoch,
      };
    default:
      return `Unknown type ${JSON.stringify(msg.type)}`;
  }
}
