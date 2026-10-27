import { $ } from "bun";

console.log(`Bun ${Bun.version}`);

const branch = await $`git rev-parse --abbrev-ref HEAD`
  .nothrow()
  .quiet()
  .text();
console.log(`git branch: ${branch.trim() || "not a git repository"}`);

const hasLockfile = await Bun.file("bun.lock").exists();
console.log(
  `lockfile: ${hasLockfile ? "present" : "missing, run bun install"}`,
);

const hasEnv = await Bun.file(".env").exists();
console.log(
  `.env: ${hasEnv ? "present" : "missing, copy .env.example to .env"}`,
);

const types = await $`${process.execPath} check`.nothrow().quiet();
console.log(
  `types: ${types.exitCode === 0 ? "ok" : "errors, run bun check"}`,
);
