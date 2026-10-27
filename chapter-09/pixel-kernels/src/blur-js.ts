// The same box blur as native/c/kernels.c, in plain TypeScript.
// It is the baseline every native version has to beat.

function blurPass(
  src: Uint8Array,
  dst: Uint8Array,
  w: number,
  h: number,
  r: number,
  horizontal: boolean,
) {
  const len = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const step = horizontal ? 4 : w * 4;
  const jump = horizontal ? w * 4 : 4;
  const div = 2 * r + 1;
  for (let line = 0; line < lines; line++) {
    const base = line * jump;
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const j = k < 0 ? 0 : k >= len ? len - 1 : k;
        sum += src[base + j * step + c]!;
      }
      for (let i = 0; i < len; i++) {
        dst[base + i * step + c] = (sum / div) | 0;
        const drop = i - r < 0 ? 0 : i - r;
        const next = i + r + 1 >= len ? len - 1 : i + r + 1;
        sum +=
          src[base + next * step + c]! -
          src[base + drop * step + c]!;
      }
    }
  }
}

export function boxBlurJs(
  src: Uint8Array,
  dst: Uint8Array,
  w: number,
  h: number,
  r: number,
) {
  const tmp = new Uint8Array(w * h * 4);
  blurPass(src, tmp, w, h, r, true);
  blurPass(tmp, dst, w, h, r, false);
}

export function grayscaleJs(rgba: Uint8Array) {
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const y =
      (77 * rgba[i]! + 150 * rgba[i + 1]! + 29 * rgba[i + 2]!) >> 8;
    rgba[i] = rgba[i + 1] = rgba[i + 2] = y;
  }
}

// Same result as boxBlurJs, but the vertical pass walks memory
// row by row with one running sum per byte of a row.
function columnSums(
  src: Uint8Array,
  dst: Uint8Array,
  w: number,
  h: number,
  r: number,
) {
  const row = w * 4;
  const div = 2 * r + 1;
  const sums = new Uint32Array(row);
  for (let k = -r; k <= r; k++) {
    const at = (k < 0 ? 0 : k >= h ? h - 1 : k) * row;
    for (let x = 0; x < row; x++) sums[x]! += src[at + x]!;
  }
  for (let y = 0; y < h; y++) {
    const out = y * row;
    const drop = (y - r < 0 ? 0 : y - r) * row;
    const next = (y + r + 1 >= h ? h - 1 : y + r + 1) * row;
    for (let x = 0; x < row; x++) {
      dst[out + x] = (sums[x]! / div) | 0;
      sums[x] = sums[x]! + src[next + x]! - src[drop + x]!;
    }
  }
}

export function boxBlurJsRows(
  src: Uint8Array,
  dst: Uint8Array,
  w: number,
  h: number,
  r: number,
) {
  const tmp = new Uint8Array(w * h * 4);
  blurPass(src, tmp, w, h, r, true);
  columnSums(tmp, dst, w, h, r);
}
