// Shows that req.formData() holds the whole upload in memory.
// Usage: bun examples/form-upload.ts data/events.ndjson
const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  maxRequestBodySize: 1024 ** 3,
  routes: {
    "/form": {
      POST: async (req) => {
        const before = process.memoryUsage().rss;
        const form = await req.formData();
        const file = form.get("file") as File;
        const grew = process.memoryUsage().rss - before;
        return Response.json({
          name: file.name,
          size: file.size,
          memoryGrowthMB: Math.round(grew / 1024 / 1024),
        });
      },
    },
  },
});

const form = new FormData();
form.append("file", Bun.file(process.argv[2]!), "upload.ndjson");
const res = await fetch(new URL("/form", server.url), {
  method: "POST",
  body: form,
});
console.log(await res.json());
server.stop(true);
