const request = require("supertest");
const { setup } = require("./helpers");

test("exposes request and runtime metrics", async () => {
  const { app } = setup();
  await request(app).get("/health");
  const res = await request(app).get("/metrics");
  expect(res.text).toContain(
    'http_request_duration_seconds_count{method="GET",route="/health"',
  );
  expect(res.text).toContain("nodejs_eventloop_lag_seconds");
  expect(res.text).toContain("process_resident_memory_bytes");
});
