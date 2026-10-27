// Request-scoped context, so log lines carry the request id
// without passing it through every function.
const cls = require("cls-hooked");

const ns = cls.createNamespace("billing");

function middleware(req, res, next) {
  ns.run(() => {
    ns.set("requestId", req.get("x-request-id") || randomId());
    next();
  });
}

const requestId = () => ns.get("requestId");
const randomId = () => Math.random().toString(36).slice(2, 10);

module.exports = { middleware, requestId };
