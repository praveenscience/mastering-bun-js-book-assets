// Turns raw input into stored events: validates each one and
// reports the ones it rejects, by position, so producers can fix
// exactly those.
import { validate } from "@igw/protocol";
import type { Stored } from "@igw/store";

export type Rejected = { index: number; error: string };

export function accept(
  items: unknown[],
  keyId: number,
  now = Date.now(),
) {
  const events: Stored[] = [];
  const rejected: Rejected[] = [];
  items.forEach((item, index) => {
    const verdict = validate(item, now);
    if (verdict.ok) events.push({ ...verdict.event, keyId });
    else rejected.push({ index, error: verdict.error });
  });
  return { events, rejected };
}
