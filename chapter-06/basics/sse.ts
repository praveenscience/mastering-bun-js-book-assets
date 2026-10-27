// A minimal Server-Sent Events endpoint. Run "bun sse.ts", then
// "curl -N localhost:3000/ticks". Remove the server.timeout() line to
// see Bun close the quiet stream after 10 seconds.
Bun.serve({
  port: 3000,
  hostname: "127.0.0.1",
  routes: {
    "/ticks": (req, server) => {
      server.timeout(req, 0); // a quiet stream is not an idle one
      return new Response(
        async function* () {
          try {
            yield ": connected\n\n";
            for (let i = 1; ; i++) {
              await Bun.sleep(12_000);
              yield `event: tick\ndata: ${i}\n\n`;
            }
          } finally {
            console.log("client went away");
          }
        },
        { headers: { "Content-Type": "text/event-stream" } },
      );
    },
  },
});
