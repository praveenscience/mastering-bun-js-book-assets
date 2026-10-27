import { startServer } from "./server";

const server = await startServer({
  dir: process.env.UPLOAD_DIR ?? "uploads",
  maxUploadBytes: 512 * 1024 * 1024, // 512 MB
  port: Number(process.env.PORT ?? 3000),
});
console.log(`Event files on ${server.url}`);
