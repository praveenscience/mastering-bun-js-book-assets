import { plugin } from "bun";

plugin({
  name: "app-info",
  setup(build) {
    build.module("app:info", () => ({
      exports: { name: "acme-api", startedAt: new Date() },
      loader: "object",
    }));
  },
});

const info = await import("app:info");
console.log(`${info.name} started at ${info.startedAt.toISOString()}`);
