// Cost of crossing the boundary: a trivial native call compared
// with a JavaScript call, and the price of passing arguments.
import { dlopen } from "bun:ffi";
import { kernels } from "../src/native";

const libc =
  process.platform === "darwin" ? "libSystem.B.dylib" : "libc.so.6";
const { symbols: c } = dlopen(libc, {
  strlen: { args: ["cstring"], returns: "u64" },
});
const k = kernels.symbols;
const jsAdd = (a: number, b: number) => (a + b) | 0;

function perCall(name: string, n: number, fn: (i: number) => void) {
  const runs: number[] = [];
  for (let run = 0; run < 3; run++) {
    const start = Bun.nanoseconds();
    for (let i = 0; i < n; i++) fn(i);
    runs.push((Bun.nanoseconds() - start) / n);
  }
  const median = runs.sort((a, b) => a - b)[1]!;
  console.log(`${name.padEnd(30)} ${median.toFixed(1)} ns`);
}

let acc = 0;
perCall("JavaScript add", 1e7, () => (acc = jsAdd(acc, 1)));
perCall("native add", 1e7, () => (acc = k.add(acc, 1)));
const four = new Uint8Array(4);
perCall("grayscale, 4-byte Uint8Array", 2e6, () =>
  k.grayscale(four, 4),
);
for (const len of [10, 1000]) {
  const text = "a".repeat(len);
  perCall(`strlen, ${len}-char string`, 2e6, () => c.strlen(text));
}
const bytes = Buffer.from("a".repeat(1000) + "\0");
perCall("strlen, 1000-byte Buffer", 2e6, () => c.strlen(bytes));
