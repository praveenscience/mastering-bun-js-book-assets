import { runSlow } from "./slow-query";

declare var self: Worker;
self.postMessage(runSlow());
