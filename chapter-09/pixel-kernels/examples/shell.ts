// bun:ffi can reach any symbol in any library, including libc.
// --no-addons does not stop this.
import { dlopen } from "bun:ffi";

const libc =
  process.platform === "darwin" ? "libSystem.B.dylib" : "libc.so.6";
const { symbols } = dlopen(libc, {
  system: { args: ["cstring"], returns: "i32" },
});
symbols.system("echo started by a shell, through bun:ffi");
