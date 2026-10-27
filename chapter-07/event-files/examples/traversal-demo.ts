// DO NOT COPY: a download route that trusts the name in the URL.
// It shows why every user-supplied path must be validated.
import { mkdir } from "node:fs/promises";

await mkdir("demo/public", { recursive: true });
await Bun.write("demo/public/hello.txt", "public file\n");
await Bun.write("demo/secret.env", "DB_PASSWORD=hunter2\n");

const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  routes: {
    "/download/:name": (req) =>
      new Response(Bun.file(`demo/public/${req.params.name}`)),
  },
});

for (const name of ["hello.txt", "..%2Fsecret.env"]) {
  const res = await fetch(new URL(`/download/${name}`, server.url));
  console.log(`${name} -> ${res.status} ${(await res.text()).trim()}`);
}
server.stop(true);
