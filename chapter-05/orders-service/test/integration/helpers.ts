import { Database } from "bun:sqlite";
import { mock } from "bun:test";
import { startServer } from "../../src/app";
import { createRepo } from "../../src/repo";

// A real server and a real (in-memory) database. Only the payment
// provider is faked, because it lives outside our system.
export function startTestApp() {
  const payments = {
    charge: mock(async () => ({
      id: "ch_test",
      status: "succeeded" as const,
    })),
  };
  let next = 0;
  const server = startServer({
    payments,
    repo: createRepo(new Database(":memory:")),
    newId: () => `ord_${++next}`,
    tokens: new Map([
      ["token-alice", "alice"],
      ["token-bob", "bob"],
    ]),
    catalog: new Map([["MUG-01", 899]]),
  });
  const call = (path: string, token?: string, body?: unknown) =>
    fetch(new URL(path, server.url), {
      method: body === undefined ? "GET" : "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  return { server, payments, call };
}
