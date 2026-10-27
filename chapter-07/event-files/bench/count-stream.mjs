// Node.js version of count-stream.ts, using readline.
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const lines = createInterface({
  input: createReadStream(process.argv[2]),
});
const byType = {};
for await (const line of lines) {
  if (!line) continue;
  const { type } = JSON.parse(line);
  byType[type] = (byType[type] ?? 0) + 1;
}
console.log(byType);
