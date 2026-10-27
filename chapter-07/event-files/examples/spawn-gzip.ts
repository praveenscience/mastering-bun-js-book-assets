// Lets the system gzip compress a file. Bun connects the file to the
// process's input and the process's output to another file.
const [src = "data/events.ndjson", dst = "data/events.gz"] =
  process.argv.slice(2);

const gzip = Bun.spawn(["gzip", "-c", "-6"], {
  stdin: Bun.file(src),
  stdout: Bun.file(dst),
});
const code = await gzip.exited;
console.log(`gzip exited with ${code}: ${Bun.file(dst).size} bytes`);
