// A deterministic test image, so every run and every language
// works on exactly the same pixels.
export type Image = { width: number; height: number; data: Uint8Array };

export function makeImage(width: number, height: number): Image {
  const data = new Uint8Array(width * height * 4);
  let seed = 42;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const i = (y * width + x) * 4;
      data[i] = (x * 255) / width;
      data[i + 1] = (y * 255) / height;
      data[i + 2] = seed >>> 24;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}
