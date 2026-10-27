// Time from spawning a service to its first successful /health
// answer. Usage: bun startup.ts <dir> <port> <command...>
// The health path is /health, or HEALTH_PATH if set.
const [dir, port, ...command] = Bun.argv.slice(2);
if (!dir || !port || command.length === 0) {
  throw new Error("usage: bun startup.ts <dir> <port> <command...>");
}

const runs: number[] = [];
for (let run = 0; run < 5; run++) {
  const start = performance.now();
  const child = Bun.spawn(command, {
    cwd: dir,
    env: { ...process.env, PORT: port },
    stdout: "ignore",
  });
  for (;;) {
    try {
      const path = process.env.HEALTH_PATH ?? "/health";
      const res = await fetch(`http://127.0.0.1:${port}${path}`);
      if (res.ok) break;
    } catch {}
    await Bun.sleep(2);
  }
  runs.push(performance.now() - start);
  child.kill();
  await child.exited;
}
runs.sort((a, b) => a - b);
console.log(`median ${runs[2]!.toFixed(0)} ms to first response`);
