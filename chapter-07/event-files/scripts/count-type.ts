// Counts events of one type read from standard input, line by line:
//   cat data/events.ndjson | bun scripts/count-type.ts purchase
const wanted = process.argv[2] ?? "purchase";
let count = 0;
for await (const line of console) {
  if (line && JSON.parse(line).type === wanted) count++;
}
console.log(`${wanted}: ${count}`);
