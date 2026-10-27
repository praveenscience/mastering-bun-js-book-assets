// Node.js version of hash.ts
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

const hash = createHash("sha256");
for await (const chunk of createReadStream(process.argv[2])) {
  hash.update(chunk);
}
console.log(hash.digest("hex"));
