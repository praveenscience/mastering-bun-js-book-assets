import { mkdir } from "node:fs/promises";
import { keepType, splitLines } from "./pipeline";
import { safePath, saveStream, TooLarge } from "./storage";
import { summarize } from "./summarize";

export type Options = {
  dir: string; // where uploaded files live
  maxUploadBytes: number;
  port?: number;
};

export async function startServer(opts: Options) {
  await mkdir(opts.dir, { recursive: true });
  const fileFor = (name: string) => {
    const path = safePath(opts.dir, name);
    return path ? Bun.file(path) : null;
  };
  const notFound = () => new Response("Not found", { status: 404 });

  return Bun.serve({
    port: opts.port ?? 0,
    hostname: "127.0.0.1",
    // Larger bodies are refused before our handler runs.
    maxRequestBodySize: opts.maxUploadBytes,
    routes: {
      "/files/:name": {
        PUT: async (req) => {
          const path = safePath(opts.dir, req.params.name);
          if (!path) return new Response("Bad name", { status: 400 });
          if (!req.body)
            return new Response("No body", { status: 400 });
          try {
            const saved = await saveStream(
              req.body,
              path,
              opts.maxUploadBytes,
            );
            return Response.json(saved, { status: 201 });
          } catch (err) {
            if (err instanceof TooLarge) {
              return new Response(err.message, { status: 413 });
            }
            throw err;
          }
        },
        // Bun answers Range requests for file responses by itself.
        GET: async (req) => {
          const file = fileFor(req.params.name);
          if (!file || !(await file.exists())) return notFound();
          return new Response(file);
        },
      },
      "/files/:name/summary": async (req) => {
        const file = fileFor(req.params.name);
        if (!file || !(await file.exists())) return notFound();
        return Response.json(await summarize(file.stream()));
      },
      "/files/:name/only/:type": async (req) => {
        const file = fileFor(req.params.name);
        if (!file || !(await file.exists())) return notFound();
        const body = file
          .stream()
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(splitLines())
          .pipeThrough(keepType(req.params.type))
          .pipeThrough(new TextEncoderStream());
        return new Response(body, {
          headers: { "Content-Type": "application/x-ndjson" },
        });
      },
      "/files/:name/gzip": async (req) => {
        const file = fileFor(req.params.name);
        if (!file || !(await file.exists())) return notFound();
        const gzipped = file
          .stream()
          .pipeThrough(new CompressionStream("gzip"));
        const filename = `${req.params.name}.gz`;
        return new Response(gzipped, {
          headers: {
            "Content-Type": "application/gzip",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      },
    },
    fetch: notFound,
  });
}
