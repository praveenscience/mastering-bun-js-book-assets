import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { upgradeWebSocket, websocket } from "hono/bun";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { newAlertId, rates } from "./rates";

const Alert = z.object({
  pair: z.enum(["GBPUSD", "EURUSD"]),
  above: z.number().positive(),
});

export const app = new Hono()
  .use(logger())
  .get("/rates/:pair", (c) => {
    const rate = rates[c.req.param("pair")];
    if (!rate) return c.json({ error: "Unknown pair" }, 404);
    return c.json({ pair: c.req.param("pair"), ...rate });
  })
  .post(
    "/alerts",
    bearerAuth({ token: "demo-token" }),
    zValidator("json", Alert),
    (c) => c.json({ id: newAlertId(), ...c.req.valid("json") }, 201),
  )
  .get(
    "/echo",
    upgradeWebSocket(() => ({
      onMessage: (event, ws) => ws.send(`echo: ${event.data}`),
    })),
  )
  .onError((err, c) => {
    // Middleware such as bearerAuth throws HTTPException on purpose.
    if (err instanceof HTTPException) return err.getResponse();
    console.error(err);
    return c.json({ error: "Internal error" }, 500);
  });

export type HonoApp = typeof app;

if (import.meta.main) {
  const server = Bun.serve({ port: 3001, fetch: app.fetch, websocket });
  console.log(`Hono on ${server.url}`);
}
