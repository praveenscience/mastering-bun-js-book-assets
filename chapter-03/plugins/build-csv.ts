import { csvLoader } from "./csv-plugin";

await Bun.build({
  entrypoints: ["./src/catalog.ts"],
  outdir: "./dist",
  target: "bun",
  plugins: [csvLoader],
});
