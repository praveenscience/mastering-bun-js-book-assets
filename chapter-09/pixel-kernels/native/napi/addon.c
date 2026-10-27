// The same box_blur as a Node-API addon. Unlike an FFI symbol,
// the addon sees real JavaScript values, so it can check them.
#include <node_api.h>
#include <stdint.h>

int32_t box_blur(const uint8_t *src, uint8_t *dst, uint32_t w,
                 uint32_t h, uint32_t r);

static uint8_t *bytes(napi_env env, napi_value v, size_t *len) {
  bool ok = false;
  napi_typedarray_type type;
  void *data;
  napi_is_typedarray(env, v, &ok);
  if (!ok) return NULL;
  napi_get_typedarray_info(env, v, &type, len, &data, NULL, NULL);
  return type == napi_uint8_array ? data : NULL;
}

static napi_value blur(napi_env env, napi_callback_info info) {
  size_t argc = 5, slen, dlen;
  napi_value argv[5];
  uint32_t n[3] = {0, 0, 0};
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  if (argc < 5) {
    napi_throw_type_error(env, NULL, "expected 5 arguments");
    return NULL;
  }
  uint8_t *src = bytes(env, argv[0], &slen);
  uint8_t *dst = bytes(env, argv[1], &dlen);
  for (int i = 0; i < 3; i++)
    napi_get_value_uint32(env, argv[i + 2], &n[i]);
  uint64_t need = (uint64_t)n[0] * n[1] * 4;
  if (!src || !dst || slen != need || dlen != need) {
    napi_throw_range_error(env, NULL, "buffers must be w*h*4 bytes");
    return NULL;
  }
  napi_value rc;
  napi_create_int32(env, box_blur(src, dst, n[0], n[1], n[2]), &rc);
  return rc;
}

NAPI_MODULE_INIT(/* napi_env env, napi_value exports */) {
  napi_value fn;
  napi_create_function(env, "boxBlur", NAPI_AUTO_LENGTH, blur,
                       NULL, &fn);
  napi_set_named_property(env, exports, "boxBlur", fn);
  return exports;
}
