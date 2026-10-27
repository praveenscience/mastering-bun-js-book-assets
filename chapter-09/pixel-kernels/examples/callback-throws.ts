// An exception in a JSCallback does not stop the native loop.
import { JSCallback } from "bun:ffi";
import { kernels } from "../src/native";

let calls = 0;
const progress = new JSCallback(
  (row: number) => {
    calls++;
    if (row === 2) throw new Error("cancel at row 2");
  },
  { args: ["u32", "u32"], returns: "void" },
);

// Four rows of pure red pixels.
const pixels = new Uint8Array(4 * 4 * 4);
for (let i = 0; i < pixels.length; i += 4) {
  pixels[i] = pixels[i + 3] = 255;
}
try {
  kernels.symbols.grayscale_rows(pixels, 4, 4, 1, progress.ptr);
} catch (e) {
  console.log("caught:", (e as Error).message);
} finally {
  progress.close();
}
console.log("callback ran", calls, "times");
console.log("last row red:", pixels.at(-4), "(255 = untouched)");
