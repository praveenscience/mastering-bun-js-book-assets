// Binds two functions from the zlib that ships with the OS.
import { dlopen } from "bun:ffi";

const name =
  process.platform === "darwin" ? "libz.dylib" : "libz.so.1";

const { symbols: zlib, close } = dlopen(name, {
  zlibVersion: { args: [], returns: "cstring" },
  // uLong crc32(uLong crc, const Bytef *buf, uInt len)
  crc32: { args: ["u64", "buffer", "u32"], returns: "u64" },
});

console.log("zlib version:", String(zlib.zlibVersion()));

const data = new TextEncoder().encode("hello, native world");
console.log("zlib crc32:", zlib.crc32(0n, data, data.length));
console.log("Bun crc32: ", Bun.hash.crc32(data));
close();
