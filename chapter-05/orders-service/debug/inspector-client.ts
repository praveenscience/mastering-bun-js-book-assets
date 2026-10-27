// Talks to a running "bun --inspect=localhost:6499/orders debug/tax.ts"
// over the WebKit Inspector Protocol, the way debuggers do.
const ws = new WebSocket("ws://localhost:6499/orders");
let lastId = 0;
const waiting = new Map<number, (reply: any) => void>();

function send(method: string, params: object = {}) {
  const id = ++lastId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise<any>((done) => waiting.set(id, done));
}

ws.onmessage = async (event) => {
  const msg = JSON.parse(String(event.data));
  if (msg.id) return waiting.get(msg.id)?.(msg.result);
  if (msg.method !== "Debugger.paused") return;
  const frame = msg.params.callFrames[0];
  const line = frame.location.lineNumber + 1;
  console.log(`paused in ${frame.functionName}, line ${line}`);
  const { result } = await send("Debugger.evaluateOnCallFrame", {
    callFrameId: frame.callFrameId,
    expression: "JSON.stringify({ pence, rate, tax })",
  });
  console.log("locals:", result.value);
  await send("Debugger.resume");
};

ws.onopen = async () => {
  await send("Debugger.enable");
  await send("Debugger.setBreakpointsActive", { active: true });
  await send("Inspector.initialized"); // the client is ready
  // Zero-based line numbers in the transpiled code: 3 is line 4,
  // "return pence + tax". Editors map lines through source maps.
  await send("Debugger.setBreakpointByUrl", {
    urlRegex: "tax\\.ts$",
    lineNumber: 3,
  });
  const res = await fetch("http://127.0.0.1:3005/?p=1000");
  console.log("response:", await res.text());
  ws.close();
};
