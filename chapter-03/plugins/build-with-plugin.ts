import { buildInfo } from "./build-info-plugin";

const result = await Bun.build({
  entrypoints: ["./src/version.ts"],
  outdir: "./dist",
  target: "bun",
  plugins: [buildInfo],
});
console.log(
  "built:",
  result.outputs.map((o) => o.path.split("/").pop()).join(", "),
);
