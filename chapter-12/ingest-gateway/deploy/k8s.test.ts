// Checks that the manifest agrees with the code (Chapter 11).
import { expect, test } from "bun:test";

const docs = Bun.YAML.parse(
  await Bun.file(`${import.meta.dir}/k8s.yaml`).text(),
) as any[];
const set = docs.find((d) => d.kind === "StatefulSet");
const pod = set.spec.template.spec;
const container = pod.containers[0];
const env = Object.fromEntries(
  container.env.map((e: { name: string; value: string }) => [
    e.name,
    e.value,
  ]),
);

test("exactly one writer per SQLite volume", () => {
  expect(set.spec.replicas).toBe(1);
  expect(set.spec.volumeClaimTemplates[0].spec.accessModes).toEqual([
    "ReadWriteOnce",
  ]);
});

test("the database lives on the persistent volume", () => {
  const mount = container.volumeMounts.find(
    (m: { name: string }) => m.name === "data",
  );
  expect(env.DB_PATH).toStartWith(`${mount.mountPath}/`);
});

test("the grace period leaves time to drain and flush", () => {
  expect(pod.terminationGracePeriodSeconds).toBeGreaterThan(
    Number(env.DRAIN_SECONDS) + 10,
  );
});

test("the pod runs locked down", () => {
  expect(pod.securityContext.runAsNonRoot).toBe(true);
  expect(container.securityContext).toMatchObject({
    readOnlyRootFilesystem: true,
    allowPrivilegeEscalation: false,
  });
});
