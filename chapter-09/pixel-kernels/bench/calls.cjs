// Per-call cost of the same tiny blur through Node-API and, when
// running in Bun, through bun:ffi. Works in Node.js and Bun.
const path = require("node:path");
const build = path.join(__dirname, "../native/build");
const { boxBlur } = require(path.join(build, "blur.node"));

const src = new Uint8Array(4);
const dst = new Uint8Array(4);
const N = 2_000_000;

function perCall(name, fn) {
  const runs = [];
  for (let run = 0; run < 3; run++) {
    const start = performance.now();
    for (let i = 0; i < N; i++) fn();
    runs.push(((performance.now() - start) * 1e6) / N);
  }
  const median = runs.sort((a, b) => a - b)[1];
  console.log(`${name.padEnd(24)} ${median.toFixed(1)} ns`);
}

const runtime =
  typeof Bun === "undefined" ? `Node ${process.version}` : "Bun";
perCall(`${runtime}, Node-API`, () => boxBlur(src, dst, 1, 1, 1));

if (typeof Bun !== "undefined") {
  const { dlopen, suffix } = require("bun:ffi");
  const lib = dlopen(path.join(build, `libkernels.${suffix}`), {
    box_blur: {
      args: ["ptr", "ptr", "u32", "u32", "u32"],
      returns: "i32",
    },
  });
  perCall("Bun, bun:ffi", () =>
    lib.symbols.box_blur(src, dst, 1, 1, 1),
  );
}
