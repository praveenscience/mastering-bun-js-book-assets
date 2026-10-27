// Deployment settings that must agree with the code. A wrong value
// here breaks rolling updates silently, so it is tested like code.
import { expect, test } from "bun:test";
import { createApp } from "../src/app";
import { loadConfig } from "../src/config";
import { RecentIds } from "../src/dedupe";
import { createLogger } from "../src/log";

const docs = Bun.YAML.parse(
  await Bun.file(`${import.meta.dir}/k8s.yaml`).text(),
) as any[];
const deployment = docs.find((d) => d.kind === "Deployment");
const pod = deployment.spec.template.spec;
const container = pod.containers[0];
const env = Object.fromEntries(
  container.env.map((e: { name: string; value: string }) => [
    e.name,
    e.value,
  ]),
);

test("the grace period covers draining and shutdown", () => {
  const needed =
    Number(env.DRAIN_SECONDS) + Number(env.SHUTDOWN_TIMEOUT_SECONDS);
  expect(pod.terminationGracePeriodSeconds).toBeGreaterThan(needed);
});

test("probes point at routes the service has", () => {
  const app = createApp({
    config: loadConfig({ API_TOKEN: "x" }),
    log: createLogger("error"),
    auth: () => true,
    dedupe: new RecentIds(1000, 10),
  });
  const probes = [container.readinessProbe, container.livenessProbe];
  for (const probe of probes) {
    expect(Object.keys(app.routes)).toContain(probe.httpGet.path);
  }
  expect(container.readinessProbe.httpGet.path).toBe("/readyz");
});

test("the pod runs locked down", () => {
  expect(pod.securityContext.runAsNonRoot).toBe(true);
  expect(container.securityContext).toMatchObject({
    allowPrivilegeEscalation: false,
    readOnlyRootFilesystem: true,
    capabilities: { drop: ["ALL"] },
  });
  expect(container.resources.limits.memory).toBeDefined();
});

test("secrets come from files, not plain values", () => {
  expect(env.API_TOKEN).toBeUndefined();
  expect(env.API_TOKEN_FILE).toStartWith("/run/secrets/");
});

test("the heap snapshot directory is writable", () => {
  const mounts = container.volumeMounts.map(
    (m: { mountPath: string }) => m.mountPath,
  );
  expect(mounts).toContain(env.HEAP_SNAPSHOT_DIR);
});
