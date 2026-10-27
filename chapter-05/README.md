# Chapter 5: Testing and Debugging Bun Applications in Depth

Code for Chapter 5 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.4.

Everything lives in `orders-service/`. Run `bun install` there first.

| Path | Section in the chapter | How to run |
| --- | --- | --- |
| `src/`, `test/unit/` | Going Deeper With the bun test Runner; Mocking Functions, Modules, and Time; Testing With Snapshots | `bun test`, `bun test test/unit`, `bun test -t coupon` |
| `test/integration/` | Writing Integration Tests; Securing Applications Through Testing | `bun test test/integration` |
| `config/`, `test/unit/config.test.ts` | Testing Configuration as Well as Code | `bun test config`; copy `production-first-try.yaml` over `production.yaml` to watch the test fail (restore it afterwards) |
| `bunfig.toml` | Measuring Coverage | `bun test --coverage`; `bun test --coverage test/unit` to see what coverage leaves out |
| `debug/tax.ts`, `debug/inspector-client.ts` | Debugging With the Console and the Inspector | `bun --inspect=localhost:6499/orders debug/tax.ts`, then `bun debug/inspector-client.ts` in a second terminal |
| `.vscode/launch.json` | Debugging in VS Code | Install the Bun extension (publisher Oven), open this folder in VS Code, press F5 |
| `debug/stack.ts` | Tracing Async Code | `bun debug/stack.ts`, then remove `await` from `return await` and run it again |
| `debug/floating-demo.ts` | Tracing Async Code | `bun test ./debug/floating-demo.ts` (fails on purpose) |
| `debug/collision-demo.ts` | Reproducing a Bug Before Fixing It | `bun test ./debug/collision-demo.ts --rerun-each 20` (fails some runs on purpose) |
| `debug/leak.ts` | Taking a First Look at Memory | `bun debug/leak.ts`, then `bun debug/leak.ts 1000` |
| `debug/fake-payments.ts` | Running the service locally | `bun debug/fake-payments.ts` in one terminal, `bun start` in another |

The files in `debug/` contain deliberate bugs or demonstrations, so they are named without `.test` and plain `bun test` skips them.
