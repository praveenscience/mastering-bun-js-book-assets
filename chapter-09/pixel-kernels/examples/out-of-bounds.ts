// WARNING: this program corrupts memory on purpose and crashes.
import { kernels } from "../src/native";

const pixels = new Uint8Array(100 * 100 * 4);
const out = new Uint8Array(pixels.length);

// The buffers hold 100 rows, but we tell C there are 4,000.
const rc = kernels.symbols.box_blur(pixels, out, 100, 4000, 4);
console.log("box_blur returned", rc);
console.log("still running...");
