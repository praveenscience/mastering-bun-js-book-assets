# Chapter 11: Production Bun with Docker, Edge Deployment, and Memory Profiling

Code for Chapter 11 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.4 on macOS (Apple M3 Max); Node.js 22.20 for the tracing comparison. The Dockerfiles and Kubernetes manifests were written for this chapter but not run here: the image build steps were reproduced locally, and `deploy/k8s.test.ts` checks the manifest against the code.

| Path | Section in the chapter | How to run |
| --- | --- | --- |
| `notify-service/src/` | Preparing a Service for Production | `bun install`, `API_TOKEN=dev bun src/main.ts`, `bun test` |
| `notify-service/scripts/shutdown-demo.ts` | Shutting Down Gracefully | `bun scripts/shutdown-demo.ts` |
| `notify-service/Dockerfile`, `Dockerfile.binary` | Building Small Container Images; Shipping a Single Binary | `bun install` (creates `bun.lock`), then `docker build -t notify .` |
| `notify-service/deploy/` | Choosing Where to Run It | `bun test deploy/` |
| `notify-service/scripts/variants.ts`, `scripts/heap-top.ts`, `loadtest/leak.ts` | Profiling CPU and Memory | `bun --cpu-prof-md scripts/variants.ts slow-auth`, `bun loadtest/leak.ts leaky` then `fixed` |
| `loadtest/load.ts` | Load Testing Against Targets | `bun loadtest/load.ts --url http://127.0.0.1:3000/events --post --rate 5000 --seconds 20 --p99 20` |
| `tracing/` | Observing the Service | `bun install`, `bun collector.ts`, then `bun run demo` and `bun run auto` |

All services listen on 127.0.0.1 unless `HOST` is set. `API_TOKEN` (or `API_TOKEN_FILE`) is required.
