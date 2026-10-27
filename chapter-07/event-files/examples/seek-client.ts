// A client that seeks: reads the last event of a large remote file,
// then resumes a download from the middle, using Range requests.
// Start the server first (bun start) and upload data/events.ndjson
// as day1.ndjson.
const url =
  process.argv[2] ?? "http://localhost:3000/files/day1.ndjson";

// 1. The last 200 bytes hold the last event.
const tail = await fetch(url, { headers: { range: "bytes=-200" } });
const lines = (await tail.text()).trim().split("\n");
console.log(tail.status, tail.headers.get("content-range"));
console.log("last event:", lines.at(-1));

// 2. Resume a download as if the first half had already arrived.
const size = Number(tail.headers.get("content-range")!.split("/")[1]);
const half = Math.floor(size / 2);
const rest = await fetch(url, { headers: { range: `bytes=${half}-` } });
await Bun.write("data/second-half.part", rest);
console.log(
  rest.status,
  `resumed at byte ${half}, saved`,
  Bun.file("data/second-half.part").size,
  "bytes",
);
