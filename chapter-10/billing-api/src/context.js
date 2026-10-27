// Request-scoped context, so log lines carry the request id
// without passing it through every function. AsyncLocalStorage
// replaces cls-hooked, whose async_hooks never fire in Bun.
const { AsyncLocalStorage } = require("async_hooks");

const store = new AsyncLocalStorage();

function middleware(req, res, next) {
  const requestId = req.get("x-request-id") || randomId();
  store.run({ requestId }, next);
}

const requestId = () => store.getStore()?.requestId;
const randomId = () => Math.random().toString(36).slice(2, 10);

module.exports = { middleware, requestId };
