// Routing rules, reloaded from routes.json while the router runs,
// so moving traffic, or moving it back, needs no restart.
export type Route = {
  prefix: string;
  backend: string;
  percent: number;
  shadow?: boolean;
};
export type Config = {
  backends: Record<string, string>;
  routes: Route[];
};

export async function load(path: string): Promise<Config> {
  const config = (await Bun.file(path).json()) as Config;
  for (const route of config.routes) {
    if (!(route.backend in config.backends)) {
      throw new Error(`unknown backend ${route.backend}`);
    }
    if (!(route.percent >= 0 && route.percent <= 100)) {
      throw new Error(`percent must be 0-100 for ${route.prefix}`);
    }
  }
  if (!config.backends.legacy) throw new Error("legacy is required");
  return config;
}
