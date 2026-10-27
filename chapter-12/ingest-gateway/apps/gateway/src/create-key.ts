// Issues an API key. Usage:
//   bun src/create-key.ts <name> [perSecond] [burst]
// The key is printed once; only its hash is stored.
import { openStore } from "@igw/store";

const [name, perSecond = "1000", burst = "5000"] = Bun.argv.slice(2);
if (!name)
  throw new Error("usage: create-key.ts <name> [rate] [burst]");
const store = await openStore(process.env.DB_PATH ?? "data/gateway.db");
console.log(store.keys.create(name, Number(perSecond), Number(burst)));
store.db.close();
