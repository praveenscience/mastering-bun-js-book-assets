import { csvLoader } from "@acme/bun-plugins/csv";

await Bun.build({
  entrypoints: ["./src/server.ts"],
  outdir: "./dist",
  target: "bun",
  plugins: [csvLoader],
});
console.log("api built");
