// Opens a store and runs one lookup, to time a cold start:
//   bun bench/cold.ts drizzle
import { makers } from "../src/stores";

const store = await makers[process.argv[2]!]!("cold.db");
await store.findById(1);
await store.close();
