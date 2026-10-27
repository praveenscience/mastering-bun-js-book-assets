# Mastering Bun.js for High-Performance JavaScript Applications: Code

The companion code for *Mastering Bun.js for High-Performance JavaScript Applications* by Praveen Kumar Purushothaman (Orange AVA). Every chapter's folder holds the runnable code from the book, with its own README that maps each folder to a section of the chapter.

## Requirements

- [Bun](https://bun.sh) 1.4.4 or a later 1.4 release
- Node.js 22, for the comparisons in Chapters 1, 6, 7, and 10, and the Node-API addon in Chapter 9
- A C compiler (clang or gcc) for Chapter 9; Rust and Zig are optional there
- Docker, only if you want to build the images in Chapters 11 and 12

Everything was written and measured on macOS with an Apple M3 Max. Performance numbers on your machine will differ; the book explains how each one was measured, so you can repeat it.

## Chapters

| Folder | Chapter |
| --- | --- |
| [chapter-01](chapter-01) | Architecture and the JavaScriptCore Advantage of Bun |
| [chapter-02](chapter-02) | A Bun-Native Development Workflow and Package Management |
| [chapter-03](chapter-03) | The Native Bundler and Transpiler |
| [chapter-04](chapter-04) | Workspaces, Monorepos, and the Plugin Ecosystem |
| [chapter-05](chapter-05) | Testing and Debugging Bun Applications in Depth |
| [chapter-06](chapter-06) | HTTP Services and Real-Time Apps With Native WebSockets |
| [chapter-07](chapter-07) | High-Performance File Streaming and I/O |
| [chapter-08](chapter-08) | Bun's Native SQLite Driver and ORMs |
| [chapter-09](chapter-09) | Foreign Function Interface and Native Interop |
| [chapter-10](chapter-10) | Auditing and Migrating Node.js Codebases Without Downtime |
| [chapter-11](chapter-11) | Production Bun with Docker, Edge Deployment, and Memory Profiling |
| [chapter-12](chapter-12) | Building a High-Throughput Real-Time Event Ingestion Gateway (Capstone Project) |

## Running the tests

```bash
scripts/test-project.sh chapter-05/orders-service   # one project
scripts/test-project.sh all                          # everything
```

The script installs each project from its committed `bun.lock`, runs its type check, and runs `bun test`, exactly as the GitHub Actions workflow in `.github/workflows/test.yml` does. Some chapters also contain example workflows inside their own folders; those are part of the chapter's lesson and are not run by this repository.

## Notes

- Example servers listen on `127.0.0.1` unless a chapter says otherwise.
- `.env` files in `chapter-02/env-demo` and `chapter-08/orm-compare` hold harmless demo values used by the examples. Never commit real secrets.
- Some examples crash on purpose (Chapter 9's out-of-bounds demo) or deliberately fail a type check (Chapter 2's `typescript/bad.ts`); their READMEs say so.

## License

The code is released under the [MIT License](LICENSE).
