# Chapter 6: HTTP Services and Real-Time Apps With Native WebSockets

Code for Chapter 6 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.4 (and Node.js 22.20 with ws 8.22.0 for the comparison).

| Folder | Section in the chapter | How to run |
| --- | --- | --- |
| `basics/` | Building Servers With Bun.serve; Streaming Responses and Server-Sent Events; Using Bun's Native WebSocket Server; Handling Backpressure | `bun server.ts`, `bun stream.ts`, `bun sse.ts` then `curl -N localhost:3000/ticks`, `bun websocket-echo.ts`; `bun backpressure.ts` with `node slow-client.mjs` in a second terminal |
| `fx-board/` | Building the Live FX Board (project), Securing Real-Time Endpoints, Shutting Down Gracefully | `bun install`, `bun test`, `bun start` and open http://localhost:3000; `bun client/watch.ts` in a second terminal, then stop and restart the server to watch the client resume |
| `frameworks/` | Choosing a Framework | `bun install`, `bun test`; `bun hono-app.ts`, `bun elysia-app.ts`, then `bun typed-clients.ts` |
| `loadtest/` | Load-Testing WebSockets | `bun install`; `bun bun-server.ts` and `node node-server.mjs` in two terminals; then `bun load.ts ws://127.0.0.1:4001 64 200` and `bun load.ts ws://127.0.0.1:4002 64 200` |

Every server in this folder listens on 127.0.0.1 only. Change `hostname` deliberately when you deploy.
