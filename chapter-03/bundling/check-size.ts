const BUDGET_BYTES = { "entry-point": 2_000, chunk: 1_000 };

const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "browser",
  minify: true,
  splitting: true,
});

let overBudget = false;
for (const output of result.outputs) {
  const limit = BUDGET_BYTES[output.kind as keyof typeof BUDGET_BYTES];
  if (limit === undefined) continue;
  const status = output.size > limit ? "OVER" : "ok";
  if (status === "OVER") overBudget = true;
  const name = output.path.split("/").pop();
  const sizes = `${output.size} / ${limit} bytes`;
  console.log(`${status.padEnd(4)} ${name} ${sizes}`);
}

if (overBudget) {
  console.error("Bundle size budget exceeded");
  process.exit(1);
}
