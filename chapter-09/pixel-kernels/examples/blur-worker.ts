// Runs the native blur off the main thread. The pixels live in
// SharedArrayBuffers, so nothing is copied in either direction.
import { kernels } from "../src/native";

declare var self: Worker;

self.onmessage = (event: MessageEvent) => {
  const { src, dst, w, h } = event.data;
  for (let i = 0; i < 5; i++) {
    kernels.symbols.box_blur(src, dst, w, h, 8);
  }
  postMessage("done");
};
