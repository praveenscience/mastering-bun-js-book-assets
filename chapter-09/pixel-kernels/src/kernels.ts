// Safe wrappers: every check happens here, in JavaScript,
// before a single byte crosses into native code.
import {
  CString,
  JSCallback,
  toArrayBuffer,
  type Pointer,
} from "bun:ffi";
import { kernels } from "./native";
import type { Image } from "./image";

const MAX_SIDE = 16_384;
const MAX_RADIUS = 64;

export class KernelError extends Error {}

// Bun accepts a deallocator as the fourth argument and exposes
// each symbol's address as .ptr, but @types/bun 1.4.4 types
// neither, so we describe them here.
const toArrayBufferOwned = toArrayBuffer as unknown as (
  p: Pointer | bigint, offset: number, length: number, free: Pointer,
) => ArrayBuffer;
const freePixels = (
  kernels.symbols.free_pixels as unknown as { ptr: Pointer }
).ptr;

function checkImage({ width, height, data }: Image) {
  for (const [name, v] of Object.entries({ width, height })) {
    if (!Number.isInteger(v) || v < 1 || v > MAX_SIDE) {
      throw new KernelError(`${name} must be 1 to ${MAX_SIDE}`);
    }
  }
  if (!(data instanceof Uint8Array)) {
    throw new KernelError("data must be a Uint8Array");
  }
  if (data.length !== width * height * 4) {
    throw new KernelError(
      `data has ${data.length} bytes, expected ` +
        `${width * height * 4}`,
    );
  }
}

export function blur(image: Image, radius: number): Image {
  checkImage(image);
  if (!Number.isInteger(radius) || radius < 1 || radius > MAX_RADIUS) {
    throw new KernelError(`radius must be 1 to ${MAX_RADIUS}`);
  }
  const { width, height } = image;
  const out = new Uint8Array(image.data.length);
  const rc = kernels.symbols.box_blur(
    image.data, out, width, height, radius,
  );
  if (rc !== 0) throw new KernelError(`box_blur failed: ${rc}`);
  return { width, height, data: out };
}

export function grayscale(image: Image): Image {
  checkImage(image);
  const data = image.data.slice();
  kernels.symbols.grayscale(data, data.length);
  return { ...image, data };
}

export function describe(image: Image): string {
  checkImage(image);
  const { width, height, data } = image;
  const p = kernels.symbols.describe(data, width, height);
  if (p === null) throw new KernelError("out of memory");
  try {
    return new CString(p).toString();
  } finally {
    kernels.symbols.free_string(p as Pointer);
  }
}

export function thumbnail(image: Image, factor: number): Image {
  checkImage(image);
  const { width, height, data } = image;
  if (!Number.isInteger(factor) || factor < 1) {
    throw new KernelError("factor must be a positive integer");
  }
  if (factor > width || factor > height) {
    throw new KernelError("factor is larger than the image");
  }
  const dims = new Uint32Array(2);
  const p = kernels.symbols.thumbnail(
    data, width, height, factor, dims,
  );
  if (p === null) throw new KernelError("out of memory");
  const [w, h] = dims as unknown as [number, number];
  // No copy: JavaScript reads the native memory directly, and the
  // garbage collector calls free_pixels once it is unreachable.
  const bytes = toArrayBufferOwned(p, 0, w * h * 4, freePixels);
  return { width: w, height: h, data: new Uint8Array(bytes) };
}

export function grayscaleWithProgress(
  image: Image,
  onProgress: (done: number, total: number) => void,
  every = 256,
): Image {
  checkImage(image);
  const data = image.data.slice();
  const cb = new JSCallback(onProgress, {
    args: ["u32", "u32"],
    returns: "void",
  });
  try {
    kernels.symbols.grayscale_rows(
      data, image.width, image.height, every, cb.ptr,
    );
  } finally {
    cb.close();
  }
  return { ...image, data };
}

export const version = () =>
  String(kernels.symbols.kernels_version());
