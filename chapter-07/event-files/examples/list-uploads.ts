// Lists stored event files with Bun.Glob, largest first.
const dir = process.argv[2] ?? "uploads";
const glob = new Bun.Glob("**/*.{ndjson,csv,txt}");

const files = [];
for await (const path of glob.scan({ cwd: dir })) {
  files.push({ path, size: Bun.file(`${dir}/${path}`).size });
}
files.sort((a, b) => b.size - a.size);
console.table(files);
