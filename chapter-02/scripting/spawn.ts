const proc = Bun.spawn(["git", "--version"], { stdout: "pipe" });
const output = await new Response(proc.stdout).text();
const exitCode = await proc.exited;

console.log(output.trim(), "exit code:", exitCode);
