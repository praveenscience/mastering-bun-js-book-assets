const quotes = new Map([["GBPUSD", { bid: 1.2699, ask: 1.2702 }]]);

const server = Bun.serve({
  port: 3000,
  hostname: "127.0.0.1",
  routes: {
    // A fixed response, built once when the server starts
    "/health": new Response("ok"),

    // A path parameter, typed as req.params.pair
    "/quotes/:pair": (req) => {
      const pair = req.params.pair.toUpperCase();
      const quote = quotes.get(pair);
      if (!quote) {
        return Response.json(
          { error: "Unknown pair" },
          { status: 404 },
        );
      }
      return Response.json({ pair, ...quote });
    },

    // Different handlers per HTTP method
    "/echo": {
      GET: (req) => new Response(new URL(req.url).search),
      POST: async (req) => Response.json(await req.json()),
    },

    // A file from disk, streamed with the right Content-Type
    "/logo.svg": new Response(
      Bun.file(`${import.meta.dir}/static/logo.svg`),
    ),
  },

  // Anything the routes did not match
  fetch(req) {
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
