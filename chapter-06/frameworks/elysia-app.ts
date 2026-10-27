import { Elysia, t } from "elysia";
import { newAlertId, rates } from "./rates";

export const app = new Elysia()
  .onRequest(({ request }) => {
    console.log(request.method, new URL(request.url).pathname);
  })
  .get("/rates/:pair", ({ params, status }) => {
    const rate = rates[params.pair];
    if (!rate) return status(404, { error: "Unknown pair" });
    return { pair: params.pair, ...rate };
  })
  .post(
    "/alerts",
    ({ body, headers, status }) => {
      if (headers.authorization !== "Bearer demo-token") {
        return status(401, { error: "Unauthorized" });
      }
      return status(201, { id: newAlertId(), ...body });
    },
    {
      body: t.Object({
        pair: t.Union([t.Literal("GBPUSD"), t.Literal("EURUSD")]),
        above: t.Number({ exclusiveMinimum: 0 }),
      }),
    },
  )
  .ws("/echo", {
    message(ws, message) {
      ws.send(`echo: ${message}`);
    },
  })
  .onError(({ code, error }) => {
    if (code === "VALIDATION" || code === "NOT_FOUND") return;
    console.error(error);
    return { error: "Internal error" };
  });

export type ElysiaApp = typeof app;

if (import.meta.main) {
  app.listen(3002);
  console.log(`Elysia on ${app.server?.url}`);
}
