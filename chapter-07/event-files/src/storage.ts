import { rename, unlink } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

const SAFE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}\.(ndjson|csv|txt)$/;

// Maps a user-supplied name to a path inside dir, or returns null.
export function safePath(dir: string, name: string): string | null {
  if (!SAFE_NAME.test(name)) return null;
  const root = resolve(dir);
  const path = resolve(root, name);
  // Belt and braces: the resolved path must still be inside root.
  return path.startsWith(root + sep) ? path : null;
}

export class TooLarge extends Error {}

// Streams a body to disk while counting and hashing it. The data goes
// to a temporary file first and is renamed only when complete, so a
// failed or oversized upload never leaves a partial file behind.
export async function saveStream(
  body: ReadableStream<Uint8Array>,
  path: string,
  maxBytes: number,
) {
  const temp = join(
    resolve(path, ".."),
    `.upload-${crypto.randomUUID()}`,
  );
  const sink = Bun.file(temp).writer();
  const hasher = new Bun.CryptoHasher("sha256");
  let bytes = 0;
  try {
    for await (const chunk of body) {
      bytes += chunk.byteLength;
      if (bytes > maxBytes)
        throw new TooLarge(`Over ${maxBytes} bytes`);
      hasher.update(chunk);
      sink.write(chunk);
    }
    await sink.end();
    await rename(temp, path); // atomic on the same file system
    return { bytes, sha256: hasher.digest("hex") };
  } catch (err) {
    await sink.end();
    await unlink(temp).catch(() => {});
    throw err;
  }
}
