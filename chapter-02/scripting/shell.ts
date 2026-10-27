import { $ } from "bun";

const files = await $`ls *.ts`.text();
console.log(
  "TypeScript files:",
  files.split("\n").filter(Boolean).length,
);

const result = await $`ls does-not-exist`.nothrow().quiet();
console.log("exit code:", result.exitCode);
