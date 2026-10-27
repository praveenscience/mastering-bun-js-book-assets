import type { Config } from "./config";
import { choose, forward, type Stats } from "./router";
import { compare } from "./shadow";

export function createHandler(getConfig: () => Config, stats: Stats) {
  const count = (key: string) => (stats[key] = (stats[key] ?? 0) + 1);

  return async (req: Request): Promise<Response> => {
    const config = getConfig();
    const backend = choose(config, req);
    count(`to:${backend}`);
    const safe = req.method === "GET" || req.method === "HEAD";
    try {
      const res = await forward(config.backends[backend]!, req);
      if (res.status >= 500 && backend !== "legacy" && safe) {
        count("fallback");
        return forward(config.backends.legacy!, req);
      }
      if (backend === "legacy" && safe) {
        compare(config, req, res.clone(), count);
      }
      return res;
    } catch (err) {
      count(`error:${backend}`);
      if (backend !== "legacy" && safe) {
        count("fallback");
        return forward(config.backends.legacy!, req);
      }
      return Response.json({ error: "bad gateway" }, { status: 502 });
    }
  };
}
