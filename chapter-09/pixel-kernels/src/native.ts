// Raw bindings to the native libraries in native/build/.
// Nothing here checks its input. Use src/kernels.ts instead.
import { dlopen, FFIType, suffix } from "bun:ffi";

const { ptr, i32, u32, u64, cstring, function: fn } = FFIType;

export const libPath = (name: string) =>
  `${import.meta.dir}/../native/build/lib${name}.${suffix}`;

const blurSymbol = {
  box_blur: { args: [ptr, ptr, u32, u32, u32], returns: i32 },
} as const;

export const kernels = dlopen(libPath("kernels"), {
  kernels_version: { args: [], returns: cstring },
  add: { args: [i32, i32], returns: i32 },
  grayscale: { args: [ptr, u64], returns: "void" },
  ...blurSymbol,
  box_blur_rows: { args: [ptr, ptr, u32, u32, u32, u32], returns: i32 },
  describe: { args: [ptr, u32, u32], returns: ptr },
  free_string: { args: [ptr], returns: "void" },
  thumbnail: { args: [ptr, u32, u32, u32, ptr], returns: ptr },
  free_pixels: { args: [ptr, ptr], returns: "void" },
  pixels_freed: { args: [], returns: u64 },
  grayscale_rows: {
    args: [ptr, u32, u32, u32, fn],
    returns: "void",
  },
});

// Optional builds: present only if build.sh found the compiler.
export function loadBlur(name: "blur_rust" | "blur_zig") {
  const path = libPath(name);
  return Bun.file(path).size > 0 ? dlopen(path, blurSymbol) : null;
}
