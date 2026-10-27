import { noSecretsInBrowser } from "./no-secrets-plugin";

for (const entry of ["./src/home.ts", "./src/checkout.ts"]) {
  const result = await Bun.build({
    entrypoints: [entry],
    outdir: "./dist",
    target: "browser",
    plugins: [noSecretsInBrowser],
    throw: false,
  });
  console.log(entry, "->", result.success ? "built" : "blocked: " + result.logs.map((l) => l.message).join("; "));
}
