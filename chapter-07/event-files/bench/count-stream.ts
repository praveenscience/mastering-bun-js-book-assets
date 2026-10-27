// Streams the file and counts events by type, one line at a time.
import { summarize } from "../src/summarize";

const summary = await summarize(Bun.file(process.argv[2]!).stream());
console.log(summary.byType);
