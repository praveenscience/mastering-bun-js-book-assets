// A tiny in-memory npm registry for trying bun publish locally.
// It keeps everything in memory and forgets it when stopped.
const packages = new Map<string, any>();

const server = Bun.serve({
  port: 4873,
  async fetch(req) {
    const name = decodeURIComponent(new URL(req.url).pathname.slice(1));
    if (req.method === "PUT") {
      const body: any = await req.json();
      const doc = packages.get(name) ?? { name, versions: {} };
      const versions = Object.entries<any>(body.versions);
      for (const [version, meta] of versions) {
        doc.versions[version] = meta;
        const deps = JSON.stringify(meta.dependencies ?? {});
        console.log(`published ${name}@${version} ${deps}`);
      }
      doc["dist-tags"] = { ...doc["dist-tags"], ...body["dist-tags"] };
      packages.set(name, doc);
      return Response.json({ ok: true });
    }
    const doc = packages.get(name);
    if (doc) return Response.json(doc);
    return Response.json({ error: "not found" }, { status: 404 });
  },
});

console.log(`mock registry on ${server.url}`);
