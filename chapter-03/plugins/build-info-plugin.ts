import type { BunPlugin } from "bun";

export const buildInfo: BunPlugin = {
  name: "build-info",
  setup(build) {
    build.onResolve({ filter: /^build:info$/ }, (args) => ({
      path: args.path,
      namespace: "build-info",
    }));

    build.onLoad(
      { filter: /.*/, namespace: "build-info" },
      async () => {
        const commit =
          (
            await Bun.$`git rev-parse --short HEAD`
              .nothrow()
              .quiet()
              .text()
          ).trim() || "unknown";
        const info = {
          commit,
          builtAt: new Date().toISOString(),
          bun: Bun.version,
        };
        return {
          contents: `export default ${JSON.stringify(info)};`,
          loader: "js",
        };
      },
    );
  },
};
