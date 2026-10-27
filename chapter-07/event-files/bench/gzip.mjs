// Node.js version of gzip.ts, using zlib.
import { createReadStream, createWriteStream, statSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

const [src, dst] = process.argv.slice(2);
await pipeline(
  createReadStream(src),
  createGzip(),
  createWriteStream(dst),
);
console.log(`${statSync(src).size} -> ${statSync(dst).size} bytes`);
