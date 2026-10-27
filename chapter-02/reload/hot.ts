globalThis.count ??= 0;
globalThis.count++;

let local = 0;
local++;

console.log(
  `reload: globalThis.count=${globalThis.count} local=${local}`,
);
setInterval(() => {}, 1000);
