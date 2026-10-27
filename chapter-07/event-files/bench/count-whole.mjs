// Node.js version of count-whole.ts
import { readFile } from "node:fs/promises";

const text = await readFile(process.argv[2], "utf8");
const byType = {};
for (const line of text.split("\n")) {
  if (!line) continue;
  const { type } = JSON.parse(line);
  byType[type] = (byType[type] ?? 0) + 1;
}
console.log(byType);
