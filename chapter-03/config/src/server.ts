import { Database } from "bun:sqlite";
import { z } from "zod";

const db = new Database(":memory:");
console.log(z.string().parse("ok"), db.query("select 1 as one").get());
