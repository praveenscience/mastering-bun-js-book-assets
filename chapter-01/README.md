# Chapter 1: Architecture and the JavaScriptCore Advantage of Bun

Code for Chapter 1 of *Mastering Bun.js for High-Performance JavaScript Applications*.
Tested with Bun 1.4.x. Install Bun first: https://bun.sh

| Folder | Section in the chapter | How to run |
| --- | --- | --- |
| `hello-bun/` | Understanding the All-in-One Toolchain; Native APIs With a JavaScript Face | `bun install`, then `bun run index.ts`, `bun test`, `bun native-apis.ts` |
| `first-server/` | Running Your First Server | `bun --hot server.ts`, then open http://localhost:3000 |
| `benchmark/` | Benchmarking Bun Against Node.js | `bun add -g autocannon`; start `bun bench-bun.ts` or `node bench-node.mjs`; then `./run-benchmark.sh` (or `WORKERS=4 ./run-benchmark.sh` if the results look suspiciously close). Startup: `hyperfine --warmup 3 "bun hello.ts" "node hello.mjs"` |
| `compat-spike/` | Running a Compatibility Spike | `bun install`, then `bun express-app.ts`, open http://localhost:3001 |
| `ci/test.yml` | Pinning a Version in CI | Copy to `.github/workflows/test.yml` in your repository |
