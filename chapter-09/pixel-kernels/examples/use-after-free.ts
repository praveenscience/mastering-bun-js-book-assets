// Reads a string after its memory was freed. Nothing stops you.
import { CString } from "bun:ffi";
import { kernels } from "../src/native";

const k = kernels.symbols;
const pixels = new Uint8Array(64 * 64 * 4).fill(200);
const p = k.describe(pixels, 64, 64)!;
console.log("before free:", JSON.stringify(new CString(p).toString()));

k.free_string(p);
// Other allocations reuse the memory p points to.
for (let i = 0; i < 100; i++) {
  k.free_string(k.describe(new Uint8Array(36).fill(i), 3, 3)!);
}
// Show unprintable characters as \u escapes.
const after = JSON.stringify(new CString(p).toString()).replace(
  /[^\x20-\x7e]/g,
  (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
);
console.log("after free: ", after);
