// For comparison: the usual Node.js setup with auto-instrumentation.
const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const {
  SimpleSpanProcessor,
} = require("@opentelemetry/sdk-trace-base");

new NodeSDK({
  serviceName: "auto",
  spanProcessors: [
    new SimpleSpanProcessor(
      new OTLPTraceExporter({ url: "http://127.0.0.1:4318/v1/traces" }),
    ),
  ],
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
}).start();
