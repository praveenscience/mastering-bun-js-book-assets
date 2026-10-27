// The event format every producer sends, and the one function that
// decides whether an event may enter the system.
export type Event = {
  id: string; // chosen by the producer; makes retries safe
  ts: number; // milliseconds since 1970
  type: string;
  user: string;
  ms?: number; // optional duration, as in Chapters 7 and 8
  props?: Record<string, unknown>;
};

export type Verdict =
  | { ok: true; event: Event }
  | { ok: false; error: string };

export const LIMITS = {
  idLength: 64,
  userLength: 128,
  propsBytes: 2048,
  propsDepth: 3,
  skewMs: 24 * 60 * 60 * 1000, // accept events up to a day off
};

const ID = /^[A-Za-z0-9_.:-]+$/;
const TYPE = /^[a-z][a-z0-9_.]{0,31}$/;
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);

const fail = (error: string): Verdict => ({ ok: false, error });

export function validate(input: unknown, now = Date.now()): Verdict {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input)
  ) {
    return fail("event must be an object");
  }
  const { id, ts, type, user, ms, props, ...rest } = input as Record<
    string,
    unknown
  >;
  const extra = Object.keys(rest);
  if (extra.length) return fail(`unknown field ${extra[0]}`);
  if (
    typeof id !== "string" ||
    !id ||
    id.length > LIMITS.idLength ||
    !ID.test(id)
  ) {
    return fail("id must be 1-64 letters, digits, or _.:-");
  }
  if (
    typeof ts !== "number" ||
    !Number.isInteger(ts) ||
    Math.abs(ts - now) > LIMITS.skewMs
  ) {
    return fail("ts must be epoch milliseconds within a day of now");
  }
  if (typeof type !== "string" || !TYPE.test(type)) {
    return fail("type must match [a-z][a-z0-9_.]{0,31}");
  }
  if (
    typeof user !== "string" ||
    !user ||
    user.length > LIMITS.userLength
  ) {
    return fail("user must be 1-128 characters");
  }
  if (
    ms !== undefined &&
    (typeof ms !== "number" ||
      !Number.isInteger(ms) ||
      ms < 0 ||
      ms > 3_600_000)
  ) {
    return fail("ms must be an integer from 0 to 3600000");
  }
  if (props !== undefined) {
    const problem = checkProps(props);
    if (problem) return fail(problem);
  }
  const event: Event = { id, ts, type, user };
  if (ms !== undefined) event.ms = ms;
  if (props !== undefined) event.props = props as Event["props"];
  return { ok: true, event };
}

function checkProps(props: unknown): string | undefined {
  if (
    typeof props !== "object" ||
    props === null ||
    Array.isArray(props)
  ) {
    return "props must be an object";
  }
  if (JSON.stringify(props).length > LIMITS.propsBytes) {
    return `props must be at most ${LIMITS.propsBytes} bytes of JSON`;
  }
  const walk = (value: unknown, depth: number): string | undefined => {
    if (typeof value !== "object" || value === null) return;
    if (depth > LIMITS.propsDepth) return "props are nested too deeply";
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN.has(key)) return `props may not contain ${key}`;
      const problem = walk(child, depth + 1);
      if (problem) return problem;
    }
  };
  return walk(props, 1);
}
