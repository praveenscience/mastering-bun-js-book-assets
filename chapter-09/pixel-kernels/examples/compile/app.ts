// Embeds the native library in a single-file executable.
// On Linux, import libkernels.so instead.
// Build: bun build --compile examples/compile/app.ts --outfile app
import { dlopen, suffix } from "bun:ffi";
import lib from "../../native/build/libkernels.dylib" with {
  type: "file",
};

console.log("library path:", lib, `(${suffix})`);
const { symbols } = dlopen(lib, {
  kernels_version: { args: [], returns: "cstring" },
  add: { args: ["i32", "i32"], returns: "i32" },
});
console.log(String(symbols.kernels_version()));
console.log("2 + 3 =", symbols.add(2, 3));
