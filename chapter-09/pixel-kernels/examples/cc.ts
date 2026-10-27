// Compiles checksum.c with Bun's embedded TinyCC at startup.
import { cc } from "bun:ffi";
import source from "./checksum.c" with { type: "file" };

const started = performance.now();
const {
  symbols: { fletcher16 },
} = cc({
  source,
  symbols: {
    fletcher16: { args: ["buffer", "u32"], returns: "u32" },
  },
});
const ms = (performance.now() - started).toFixed(1);
console.log(`compiled in ${ms} ms`);

const bytes = new TextEncoder().encode("abcde");
console.log("fletcher16(abcde) =", fletcher16(bytes, bytes.length));
