// Browsers cannot add an Authorization header to a WebSocket, so the
// client first swaps its token for a short-lived, single-use ticket
// over normal HTTP, then passes the ticket in the WebSocket URL.
export function createTickets(ttlMs = 30_000) {
  const tickets = new Map<string, { user: string; expires: number }>();
  return {
    issue(user: string) {
      const ticket = crypto.randomUUID();
      tickets.set(ticket, { user, expires: Date.now() + ttlMs });
      return ticket;
    },
    redeem(ticket: string | null): string | null {
      if (!ticket) return null;
      const entry = tickets.get(ticket);
      tickets.delete(ticket); // single use, even if expired
      if (!entry || entry.expires < Date.now()) return null;
      return entry.user;
    },
  };
}
