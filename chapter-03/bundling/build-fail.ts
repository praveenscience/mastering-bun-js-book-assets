// Shows both failure styles of Bun.build
try {
  await Bun.build({ entrypoints: ["./src/missing.ts"], outdir: "./dist" });
} catch (error) {
  console.log("threw", (error as AggregateError).constructor.name, (error as AggregateError).errors?.[0]?.message);
}
const result = await Bun.build({ entrypoints: ["./src/missing.ts"], outdir: "./dist", throw: false });
console.log("throw: false -> success =", result.success, "| logs:", result.logs.length);
