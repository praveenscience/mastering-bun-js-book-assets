// A BunFile is a reference: creating one reads nothing.
const file = Bun.file("data/events.ndjson");
console.log("size:", file.size, "bytes");
console.log("type:", file.type);
console.log("exists:", await file.exists());

const missing = Bun.file("data/nope.json");
const found = await missing.exists();
console.log("missing size:", missing.size, "exists:", found);

// slice() is lazy too: it describes a byte range without reading it.
const firstLine = await file.slice(0, 200).text();
console.log("first event:", firstLine.split("\n")[0]);
