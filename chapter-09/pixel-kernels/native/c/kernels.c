// Image kernels for Chapter 9, exported with a plain C ABI.
// Pixels are RGBA, 4 bytes each, rows packed with no padding.
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define KERNELS_VERSION "pixel-kernels 1.0.0"

const char *kernels_version(void) { return KERNELS_VERSION; }

int32_t add(int32_t a, int32_t b) { return a + b; }

// Converts pixels to gray in place, keeping alpha.
void grayscale(uint8_t *rgba, uint64_t len) {
  for (uint64_t i = 0; i + 3 < len; i += 4) {
    uint32_t y = (77 * rgba[i] + 150 * rgba[i + 1]
                  + 29 * rgba[i + 2]) >> 8;
    rgba[i] = rgba[i + 1] = rgba[i + 2] = (uint8_t)y;
  }
}

static void blur_pass(const uint8_t *src, uint8_t *dst, uint32_t w,
                      uint32_t h, uint32_t r, int horizontal) {
  uint32_t len = horizontal ? w : h;
  uint32_t lines = horizontal ? h : w;
  uint64_t step = horizontal ? 4 : (uint64_t)w * 4;
  uint64_t jump = horizontal ? (uint64_t)w * 4 : 4;
  for (uint32_t line = 0; line < lines; line++) {
    const uint8_t *in = src + line * jump;
    uint8_t *out = dst + line * jump;
    for (int c = 0; c < 4; c++) {
      uint32_t sum = 0;
      // Window [i - r, i + r], with edge pixels repeated.
      for (int64_t k = -(int64_t)r; k <= (int64_t)r; k++) {
        int64_t j = k < 0 ? 0 : (k >= len ? len - 1 : k);
        sum += in[j * step + c];
      }
      for (uint32_t i = 0; i < len; i++) {
        out[i * step + c] = (uint8_t)(sum / (2 * r + 1));
        int64_t drop = (int64_t)i - r;
        int64_t next = (int64_t)i + r + 1;
        drop = drop < 0 ? 0 : drop;
        next = next >= len ? len - 1 : next;
        sum += in[next * step + c] - in[drop * step + c];
      }
    }
  }
}

// Box blur with radius r. Returns 0 on success, -1 for bad
// arguments, -2 when scratch memory cannot be allocated.
int32_t box_blur(const uint8_t *src, uint8_t *dst, uint32_t w,
                 uint32_t h, uint32_t r) {
  if (!src || !dst || w == 0 || h == 0 || r == 0) return -1;
  uint8_t *tmp = malloc((size_t)w * h * 4);
  if (!tmp) return -2;
  blur_pass(src, tmp, w, h, r, 1);
  blur_pass(tmp, dst, w, h, r, 0);
  free(tmp);
  return 0;
}

// Vertical pass that walks memory row by row: one running sum
// per byte of a row, so every read is sequential.
static void column_sums(const uint8_t *src, uint8_t *dst,
                        uint32_t *sums, uint32_t w, uint32_t h,
                        uint32_t r, uint32_t from, uint32_t to) {
  uint64_t row = (uint64_t)w * 4;
  for (int64_t k = -(int64_t)r; k <= (int64_t)r; k++) {
    int64_t j = k < 0 ? 0 : (k >= h ? h - 1 : k);
    for (uint32_t x = from; x < to; x++)
      sums[x - from] += src[j * row + x];
  }
  for (uint32_t y = 0; y < h; y++) {
    int64_t drop = (int64_t)y - r, next = (int64_t)y + r + 1;
    drop = drop < 0 ? 0 : drop;
    next = next >= h ? h - 1 : next;
    for (uint32_t x = from; x < to; x++) {
      dst[y * row + x] = (uint8_t)(sums[x - from] / (2 * r + 1));
      sums[x - from] += src[next * row + x] - src[drop * row + x];
    }
  }
}

typedef struct {
  const uint8_t *src;
  uint8_t *dst;
  uint32_t *sums;
  uint32_t w, h, r, from, to;
} job_t;

static void *run_job(void *arg) {
  job_t *j = arg;
  column_sums(j->src, j->dst, j->sums + j->from, j->w, j->h, j->r,
              j->from, j->to);
  return NULL;
}

// Same result as box_blur, with a cache-friendly vertical pass
// split across `threads` threads (1 means no extra threads).
int32_t box_blur_rows(const uint8_t *src, uint8_t *dst, uint32_t w,
                      uint32_t h, uint32_t r, uint32_t threads) {
  if (!src || !dst || w == 0 || h == 0 || r == 0) return -1;
  if (threads < 1 || threads > 64) return -1;
  uint8_t *tmp = malloc((size_t)w * h * 4);
  uint32_t *sums = calloc((size_t)w * 4, sizeof(uint32_t));
  if (!tmp || !sums) {
    free(tmp);
    free(sums);
    return -2;
  }
  blur_pass(src, tmp, w, h, r, 1);
  pthread_t ids[64];
  job_t jobs[64];
  // Each thread owns a band of byte columns [from, to).
  uint32_t row = w * 4, chunk = (row + threads - 1) / threads;
  uint32_t used = 0;
  for (uint32_t from = 0; from < row; from += chunk, used++) {
    uint32_t to = from + chunk > row ? row : from + chunk;
    jobs[used] = (job_t){tmp, dst, sums, w, h, r, from, to};
    if (threads == 1) run_job(&jobs[used]);
    else pthread_create(&ids[used], NULL, run_job, &jobs[used]);
  }
  for (uint32_t t = 0; threads > 1 && t < used; t++)
    pthread_join(ids[t], NULL);
  free(tmp);
  free(sums);
  return 0;
}

// Returns a new string the caller must release with free_string.
char *describe(const uint8_t *rgba, uint32_t w, uint32_t h) {
  uint64_t total = 0, n = (uint64_t)w * h;
  for (uint64_t i = 0; i < n; i++) total += rgba[i * 4];
  char *text = malloc(96);
  if (!text) return NULL;
  snprintf(text, 96, "%ux%u, mean red %.1f", w, h,
           n ? (double)total / n : 0.0);
  return text;
}

void free_string(char *text) { free(text); }

typedef void (*progress_fn)(uint32_t done, uint32_t total);

// Grayscale row by row, reporting progress every `every` rows.
void grayscale_rows(uint8_t *rgba, uint32_t w, uint32_t h,
                    uint32_t every, progress_fn progress) {
  for (uint32_t row = 0; row < h; row++) {
    grayscale(rgba + (uint64_t)row * w * 4, (uint64_t)w * 4);
    if (progress && every && (row + 1) % every == 0)
      progress(row + 1, h);
  }
}

// Shrinks the image by `factor`, averaging each block. Writes the
// new size to dims[0] and dims[1] and returns new pixels, which
// must be released with free_pixels.
uint8_t *thumbnail(const uint8_t *src, uint32_t w, uint32_t h,
                   uint32_t factor, uint32_t *dims) {
  if (!src || !dims || factor == 0 || w < factor || h < factor)
    return NULL;
  uint32_t tw = w / factor, th = h / factor;
  uint8_t *out = malloc((size_t)tw * th * 4);
  if (!out) return NULL;
  for (uint32_t y = 0; y < th; y++)
    for (uint32_t x = 0; x < tw; x++)
      for (int c = 0; c < 4; c++) {
        uint32_t sum = 0;
        for (uint32_t dy = 0; dy < factor; dy++)
          for (uint32_t dx = 0; dx < factor; dx++)
            sum += src[(((uint64_t)y * factor + dy) * w
                        + x * factor + dx) * 4 + c];
        out[((uint64_t)y * tw + x) * 4 + c] =
          (uint8_t)(sum / (factor * factor));
      }
  dims[0] = tw;
  dims[1] = th;
  return out;
}

static uint64_t freed = 0;

// Matches JavaScriptCore's JSTypedArrayBytesDeallocator, so Bun
// can call it when the garbage collector drops the ArrayBuffer.
void free_pixels(void *bytes, void *context) {
  (void)context;
  free(bytes);
  freed++;
}

uint64_t pixels_freed(void) { return freed; }
