// Shadow traffic: send a copy of a legacy GET to the new backend,
// compare the two answers, and log differences. Users only ever
// see the legacy response.
import type { Config } from "./config";

export function compare(
  config: Config,
  req: Request,
  legacy: Response,
  count: (key: string) => void,
) {
  const url = new URL(req.url);
  const route = config.routes.find(
    (r) => r.shadow && url.pathname.startsWith(r.prefix),
  );
  if (!route) return;
  const target = config.backends[route.backend]!;
  void (async () => {
    try {
      const next = await fetch(target + url.pathname + url.search, {
        headers: req.headers,
      });
      const [a, b] = await Promise.all([legacy.text(), next.text()]);
      if (legacy.status === next.status && same(a, b)) {
        count("shadow:match");
      } else {
        count("shadow:diff");
        console.warn(JSON.stringify({
          shadow: "diff",
          path: url.pathname + url.search,
          legacy: legacy.status,
          next: next.status,
        }));
      }
    } catch {
      count("shadow:error");
    }
  })();
}

function same(a: string, b: string) {
  try {
    return Bun.deepEquals(JSON.parse(a), JSON.parse(b));
  } catch {
    return a === b;
  }
}
