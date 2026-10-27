# Chapter 7: High-Performance File Streaming and I/O

Code for Chapter 7 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.4 (and Node.js 22.20 for the benchmarks).

Everything lives in `event-files/`. Run `bun install` there, then create the sample data with `bun scripts/make-events.ts 5000000 data/events.ndjson` (about 373 MB; use a smaller number for a quick start).

| Path | Section in the chapter | How to run |
| --- | --- | --- |
| `examples/lazy-file.ts` | Working With Lazy Files | `bun examples/lazy-file.ts` |
| `examples/write-file.ts` | Writing Files With Bun.write | `bun examples/write-file.ts` |
| `src/lines.ts`, `src/summarize.ts` | Parsing Large Inputs Incrementally | `bun test test/lines.test.ts test/summarize.test.ts` |
| `src/pipeline.ts` | Building Web Streams Pipelines | used by `GET /files/:name/only/:type` |
| `src/storage.ts`, `src/server.ts` | Streaming Uploads and Downloads; Serving Large Files With Range Requests | `bun start`, then `curl -T data/events.ndjson localhost:3000/files/day1.ndjson` and `curl -r 0-99 localhost:3000/files/day1.ndjson` |
| `bench/` | Benchmarking Against Node.js | `sh bench/run.sh data/events.ndjson` (needs `bun` and `node` on PATH; macOS `/usr/bin/time`) |
| `examples/traversal-demo.ts` | Handling Untrusted Files Safely | `bun examples/traversal-demo.ts` (a deliberately unsafe route) |
| `test/` | All sections | `bun test` |

Generated files (`data/`, `uploads/`, `demo/`) are ignored by Git.
