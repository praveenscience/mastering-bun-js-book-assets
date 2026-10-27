// CRC-32 of 256 MB with the OS zlib and with Bun's built-in hash.
import { dlopen } from "bun:ffi";

const name =
  process.platform === "darwin" ? "libz.dylib" : "libz.so.1";
const { symbols: zlib } = dlopen(name, {
  crc32: { args: ["u64", "buffer", "u32"], returns: "u64" },
});

const data = new Uint8Array(256 * 2 ** 20).map((_, i) => i * 31);
const time = (fn: () => unknown) => {
  const runs: number[] = [];
  for (let run = 0; run < 5; run++) {
    const start = Bun.nanoseconds();
    fn();
    runs.push((Bun.nanoseconds() - start) / 1e6);
  }
  return runs.sort((a, b) => a - b)[2]!.toFixed(1);
};

const same =
  zlib.crc32(0n, data, data.length) === BigInt(Bun.hash.crc32(data));
console.log("results match:", same);
const viaZlib = time(() => zlib.crc32(0n, data, data.length));
const viaBun = time(() => Bun.hash.crc32(data));
console.log(`zlib crc32:     ${viaZlib} ms`);
console.log(`Bun.hash.crc32: ${viaBun} ms`);
