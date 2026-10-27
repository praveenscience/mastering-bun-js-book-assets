// Compresses a file with gzip as a stream.
const [src, dst] = process.argv.slice(2) as [string, string];
const gzipped = Bun.file(src)
  .stream()
  .pipeThrough(new CompressionStream("gzip"));
await Bun.write(dst, new Response(gzipped));
console.log(`${Bun.file(src).size} -> ${Bun.file(dst).size} bytes`);
