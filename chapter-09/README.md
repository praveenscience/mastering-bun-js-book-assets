# Chapter 9: Foreign Function Interface and Native Interop

Code for Chapter 9 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.4 on macOS (Apple M3 Max), Apple clang 17, Rust 1.99.1, Zig 0.17.0, and Node.js 22.20 for the Node-API comparison.

Everything lives in `pixel-kernels/`. Run `bun install`, then `./build.sh` once: it builds the C library (needs clang or gcc) and, when the tools are installed, the Rust and Zig versions and the Node-API addon. Built files go to `native/build/`.

| Path | Section in the chapter | How to run |
| --- | --- | --- |
| `examples/zlib.ts` | Making Your First Native Call | `bun examples/zlib.ts` |
| `native/`, `src/`, `examples/cc.ts` | Building a Native Library | `./build.sh`, `bun examples/cc.ts` |
| `src/kernels.ts`, `examples/wrong-types.ts`, `examples/callback-throws.ts` | Moving Data Across the Boundary | `bun examples/wrong-types.ts`, `bun examples/callback-throws.ts` |
| `examples/leak.ts`, `examples/use-after-free.ts`, `examples/blocking.ts` | Managing Native Memory | `bun examples/leak.ts [free]`, `bun examples/use-after-free.ts`, `bun examples/blocking.ts` |
| `bench/` | Benchmarking Native Interop | `bun bench/overhead.ts`, `bun bench/blur.ts`, `bun bench/crc32.ts` |
| `native/napi/`, `bench/calls.cjs`, `examples/compile/` | Choosing Between FFI and Node-API | `bun bench/calls.cjs`, `node bench/calls.cjs`, `bun build --compile examples/compile/app.ts --outfile app` |
| `examples/out-of-bounds.ts`, `examples/shell.ts`, `test/` | Securing the Native Trust Boundary | `bun examples/out-of-bounds.ts` (crashes on purpose), `bun examples/shell.ts`, `bun test` |

`examples/compile/app.ts` imports `libkernels.dylib`; on Linux, change it to `libkernels.so`.
