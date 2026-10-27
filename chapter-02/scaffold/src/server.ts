import { loadConfig } from "./config";

const config = loadConfig();

const server = Bun.serve({
  port: config.PORT,
  routes: {
    "/health": () =>
      Response.json({
        status: "ok",
        app: config.APP_NAME,
        env: config.NODE_ENV,
      }),
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`${config.APP_NAME} listening on ${server.url}`);
