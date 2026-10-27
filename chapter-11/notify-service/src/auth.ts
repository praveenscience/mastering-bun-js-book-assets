import { createHash, timingSafeEqual } from "node:crypto";

const digest = (s: string) => createHash("sha256").update(s).digest();

// Checks "Authorization: Bearer <token>" in constant time. Hashing
// both sides first gives equal-length buffers for timingSafeEqual.
export function bearerChecker(expected: string) {
  const want = digest(expected);
  return (header: string | null): boolean => {
    if (!header?.startsWith("Bearer ")) return false;
    return timingSafeEqual(digest(header.slice(7)), want);
  };
}
export type AuthCheck = (
  header: string | null,
) => boolean | Promise<boolean>;
