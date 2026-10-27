export type OrderRequest = {
  lines: { sku: string; qty: number }[];
  cardToken: string;
};

// Returns the cleaned request, or a message saying what is wrong.
export function parseOrder(body: unknown): OrderRequest | string {
  if (typeof body !== "object" || body === null) return "Not an object";
  const { lines, cardToken } = body as Record<string, unknown>;
  if (typeof cardToken !== "string" || cardToken.length > 64) {
    return "cardToken must be a short string";
  }
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 50) {
    return "lines must hold 1 to 50 items";
  }
  const clean = [];
  for (const line of lines) {
    const { sku, qty } = (line ?? {}) as Record<string, unknown>;
    if (typeof sku !== "string" || !/^[A-Z0-9-]{1,20}$/.test(sku)) {
      return "Each sku must be 1 to 20 letters, digits, or dashes";
    }
    if (!Number.isInteger(qty) || (qty as number) < 1) {
      return "Each qty must be a whole number above zero";
    }
    if ((qty as number) > 100) return "qty is limited to 100";
    // Only sku and qty are kept: the client never sets a price.
    clean.push({ sku, qty: qty as number });
  }
  return { lines: clean, cardToken };
}
