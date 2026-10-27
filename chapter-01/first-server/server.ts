const server = Bun.serve({
  port: 3000,
  routes: {
    "/": new Response("Hello from Bun"),
    "/health": Response.json({ status: "ok" }),
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
