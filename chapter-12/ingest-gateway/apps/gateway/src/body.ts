// Reads a request body as text, but never more than `max` bytes.
// Chapter 7 showed that chunked uploads bypass Bun's up-front size
// check, so the limit is enforced while reading.
export class TooLarge extends Error {}

export async function readLimited(req: Request, max: number) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > max) throw new TooLarge();
  if (!req.body) return "";
  const parts: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of req.body) {
    size += chunk.byteLength;
    if (size > max) throw new TooLarge();
    parts.push(chunk);
  }
  return new TextDecoder().decode(Buffer.concat(parts));
}
