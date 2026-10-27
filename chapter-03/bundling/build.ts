const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "browser",
  minify: true,
  splitting: true,
});

console.log("success:", result.success);
for (const output of result.outputs) {
  console.log(
    output.kind.padEnd(12),
    output.path.split("/").pop(),
    output.size,
    "bytes",
  );
}
