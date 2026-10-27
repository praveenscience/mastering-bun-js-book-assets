export function gitCommit(): string {
  return Bun.spawnSync(["git", "rev-parse", "--short", "HEAD"])
    .stdout.toString()
    .trim();
}

export function buildTime(): string {
  return new Date().toISOString();
}
