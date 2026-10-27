import type { BunPlugin } from "bun";

export const csvCount: BunPlugin = {
  name: "csv-count",
  setup(build) {
    build.onLoad({ filter: /\.csv$/ }, async (args) => {
      const text = await Bun.file(args.path).text();
      const rows = text.trim().split("\n").length - 1;
      return { exports: { default: rows }, loader: "object" };
    });
  },
};
