const client = require("prom-client");

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "route", "status"],
  registers: [registry],
});

function middleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on("finish", () => {
    const route = req.route ? req.route.path : "unmatched";
    end({ method: req.method, route, status: res.statusCode });
  });
  next();
}

module.exports = { registry, middleware };
