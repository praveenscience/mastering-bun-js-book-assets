# Chapter 12: Building a High-Throughput Real-Time Event Ingestion Gateway (Capstone Project)

Code for Chapter 12 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.4 on macOS (Apple M3 Max). The Dockerfile and Kubernetes manifest were checked without a cluster: the image build steps were reproduced locally, and `deploy/k8s.test.ts` checks the manifest.

`ingest-gateway/` is a Bun workspace (Chapter 4):

| Path | What it is |
| --- | --- |
| `packages/protocol` | The event format and `validate()` |
| `packages/store` | SQLite storage: migrations (embedded as text imports), events with an outbox cursor, API keys, retention |
| `apps/gateway` | The gateway: HTTP, NDJSON, and WebSocket ingestion, batching with backpressure, API keys and rate limits, Worker-based forwarding, metrics, graceful shutdown |
| `apps/sink` | A stand-in downstream warehouse that de-duplicates and can simulate outages |
| `tools/loadgen` | `load.ts` (open-model load test with targets), `upload.ts` (NDJSON bulk upload), `crash.ts` (kill -9 durability test) |
| `deploy/` | Kubernetes StatefulSet and its tests |

Getting started:

```bash
cd ingest-gateway
bun install
bun test
cd apps/gateway && bun src/create-key.ts my-app   # prints an API key
bun --filter @igw/sink start &                     # from the root
SINK_URL=http://127.0.0.1:8090/ingest bun src/main.ts
IGW_KEY=<key> bun ../../tools/loadgen/load.ts --rate 1000 --batch 100
```

All services listen on 127.0.0.1 unless `HOST` is set.
