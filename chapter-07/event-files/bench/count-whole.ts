// Reads the whole file into one string, then counts events by type.
const text = await Bun.file(process.argv[2]!).text();
const byType: Record<string, number> = {};
for (const line of text.split("\n")) {
  if (!line) continue;
  const { type } = JSON.parse(line);
  byType[type] = (byType[type] ?? 0) + 1;
}
console.log(byType);
