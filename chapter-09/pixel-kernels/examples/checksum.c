#include <stdint.h>

// Fletcher-16 checksum of len bytes.
uint32_t fletcher16(const uint8_t *data, uint32_t len) {
  uint32_t a = 0, b = 0;
  for (uint32_t i = 0; i < len; i++) {
    a = (a + data[i]) % 255;
    b = (b + a) % 255;
  }
  return (b << 8) | a;
}
