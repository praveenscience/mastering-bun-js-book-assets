import { describe as group, expect, test } from "bun:test";
import { boxBlurJs, boxBlurJsRows, grayscaleJs } from "../src/blur-js";
import { makeImage } from "../src/image";
import {
  KernelError,
  blur,
  describe,
  grayscale,
  grayscaleWithProgress,
  thumbnail,
  version,
} from "../src/kernels";
import { kernels, loadBlur } from "../src/native";

const img = makeImage(97, 61);
const reference = new Uint8Array(img.data.length);
boxBlurJs(img.data, reference, img.width, img.height, 3);

group("blur parity", () => {
  test("safe wrapper matches the TypeScript blur", () => {
    expect(blur(img, 3).data).toEqual(reference);
  });

  test("row-wise versions match, with and without threads", () => {
    const out = new Uint8Array(img.data.length);
    boxBlurJsRows(img.data, out, img.width, img.height, 3);
    expect(out).toEqual(reference);
    for (const threads of [1, 3, 8]) {
      out.fill(0);
      kernels.symbols.box_blur_rows(
        img.data, out, img.width, img.height, 3, threads,
      );
      expect(out).toEqual(reference);
    }
  });

  for (const name of ["blur_rust", "blur_zig"] as const) {
    test.skipIf(!loadBlur(name))(`${name} matches`, () => {
      const out = new Uint8Array(img.data.length);
      loadBlur(name)!.symbols.box_blur(
        img.data, out, img.width, img.height, 3,
      );
      expect(out).toEqual(reference);
    });
  }

  const addon = `${import.meta.dir}/../native/build/blur.node`;
  test.skipIf(Bun.file(addon).size === 0)(
    "Node-API addon matches",
    () => {
      const { boxBlur } = require(addon);
      const out = new Uint8Array(img.data.length);
      boxBlur(img.data, out, img.width, img.height, 3);
      expect(out).toEqual(reference);
    },
  );
});

group("validation", () => {
  test("rejects a buffer that does not match the size", () => {
    const bad = { ...img, height: 4000 };
    expect(() => blur(bad, 3)).toThrow(KernelError);
    expect(() => blur(bad, 3)).toThrow("expected 1552000");
  });

  test("rejects sizes that would wrap around in C", () => {
    expect(() => blur({ ...img, width: -1 }, 3)).toThrow(
      "width must be 1 to 16384",
    );
    expect(() => blur({ ...img, width: 2 ** 32 + 97 }, 3)).toThrow(
      "width must be 1 to 16384",
    );
  });

  test("rejects bad radii and non-byte arrays", () => {
    expect(() => blur(img, 0)).toThrow("radius must be 1 to 64");
    expect(() => blur(img, 1.5)).toThrow("radius must be 1 to 64");
    const floats = { ...img, data: new Float32Array(4) };
    expect(() => blur(floats as never, 1)).toThrow("Uint8Array");
  });
});

group("data across the boundary", () => {
  test("grayscale matches and leaves the input alone", () => {
    const before = img.data.slice();
    const gray = grayscale(img);
    const expected = img.data.slice();
    grayscaleJs(expected);
    expect(gray.data).toEqual(expected);
    expect(img.data).toEqual(before);
  });

  test("strings come back and are freed", () => {
    expect(version()).toBe("pixel-kernels 1.0.0");
    expect(describe(img)).toMatch(/^97x61, mean red \d+\.\d$/);
  });

  test("thumbnail reads native memory without a copy", () => {
    const small = thumbnail(makeImage(64, 32), 8);
    expect([small.width, small.height]).toEqual([8, 4]);
    expect(small.data.length).toBe(8 * 4 * 4);
    expect(small.data[3]).toBe(255);
  });

  test("the garbage collector frees thumbnails", async () => {
    const before = kernels.symbols.pixels_freed();
    for (let i = 0; i < 200; i++) thumbnail(img, 4);
    Bun.gc(true);
    await Bun.sleep(10);
    Bun.gc(true);
    const freed = kernels.symbols.pixels_freed() - before;
    expect(freed).toBeGreaterThan(150n);
  });

  test("native code calls back into JavaScript", () => {
    const seen: string[] = [];
    grayscaleWithProgress(img, (done, total) => {
      seen.push(`${done}/${total}`);
    }, 20);
    expect(seen).toEqual(["20/61", "40/61", "60/61"]);
  });
});
