// Maps an Authorization header to a customer ID, or null.
export function customerFor(
  header: string | null,
  tokens: Map<string, string>,
): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return tokens.get(header.slice(7)) ?? null;
}
