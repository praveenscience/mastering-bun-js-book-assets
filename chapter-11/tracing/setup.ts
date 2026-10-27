// Preloaded before the app: starts the OpenTelemetry SDK with an
// OTLP exporter. No auto-instrumentation: on Bun, we add spans and
// propagate context ourselves (see traced.ts).
import { NodeSDK } from "@opentelemetry/sdk-node";
import * as otlp from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? "notify",
  spanProcessors: [
    new BatchSpanProcessor(
      new otlp.OTLPTraceExporter({
        url:
          process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
          "http://127.0.0.1:4318/v1/traces",
      }),
    ),
  ],
});
sdk.start();
process.on("beforeExit", () => sdk.shutdown());
