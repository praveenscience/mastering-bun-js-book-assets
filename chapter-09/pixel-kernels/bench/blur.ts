// Blurs a 4K test image with every implementation and prints
// the median of five runs for each. Run ./build.sh first.
import { cc } from "bun:ffi";
import { boxBlurJs, boxBlurJsRows } from "../src/blur-js";
import { makeImage } from "../src/image";
import { kernels, loadBlur } from "../src/native";

const [w, h, r] = [3840, 2160, 4];
const { data } = makeImage(w, h);
const out = new Uint8Array(data.length);

const tcc = cc({
  source: `${import.meta.dir}/../native/c/kernels.c`,
  symbols: {
    box_blur: {
      args: ["ptr", "ptr", "u32", "u32", "u32"],
      returns: "i32",
    },
  },
});

const rows = kernels.symbols.box_blur_rows;
type Blur = (s: Uint8Array, d: Uint8Array, ...n: number[]) => unknown;
const contenders: [string, Blur | undefined][] = [
  ["TypeScript (JIT)", boxBlurJs as Blur],
  ["C, clang -O2", kernels.symbols.box_blur],
  ["Rust, release", loadBlur("blur_rust")?.symbols.box_blur],
  ["Zig, ReleaseFast", loadBlur("blur_zig")?.symbols.box_blur],
  ["C, cc() TinyCC", tcc.symbols.box_blur],
  ["TypeScript, rows", boxBlurJsRows as Blur],
  ["C, rows", (s, d) => rows(s, d, w, h, r, 1)],
  ["C, rows, 8 threads", (s, d) => rows(s, d, w, h, r, 8)],
];

const expected = Bun.hash(
  (boxBlurJs(data, out, w, h, r), out),
);
for (const [name, blur] of contenders) {
  if (!blur) continue;
  const times: number[] = [];
  for (let run = 0; run < 5; run++) {
    out.fill(0);
    const start = Bun.nanoseconds();
    blur(data, out, w, h, r);
    times.push((Bun.nanoseconds() - start) / 1e6);
    if (Bun.hash(out) !== expected) throw new Error(name);
  }
  const median = times.sort((a, b) => a - b)[2]!;
  console.log(`${name.padEnd(18)} ${median.toFixed(1)} ms`);
}
