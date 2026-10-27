import type { Database } from "bun:sqlite";
import { createHash, randomBytes } from "node:crypto";

export type ApiKey = {
  id: number;
  name: string;
  per_second: number;
  burst: number;
};

const hash = (token: string) =>
  createHash("sha256").update(token).digest();

export function createKeyStore(db: Database) {
  const add = db.prepare(
    `INSERT INTO api_keys
       (name, hash, prefix, per_second, burst, created_at)
     VALUES ($name, $hash, $prefix, $perSecond, $burst, $now)`,
  );
  const byHash = db.prepare(
    `SELECT id, name, per_second, burst FROM api_keys
     WHERE hash = $hash AND revoked_at IS NULL`,
  );
  const revoke = db.prepare(
    "UPDATE api_keys SET revoked_at = $now WHERE name = $name",
  );

  return {
    // Returns the key once; only its hash is kept.
    create(name: string, perSecond = 1000, burst = 5000) {
      const prefix = randomBytes(4).toString("hex");
      const secret = randomBytes(24).toString("base64url");
      const token = `igw_${prefix}_${secret}`;
      add.run({
        name,
        hash: hash(token),
        prefix,
        perSecond,
        burst,
        now: Date.now(),
      });
      return token;
    },
    // Looks a key up by the hash of what the producer sent. The
    // lookup compares hashes, so timing reveals nothing useful
    // about the key itself.
    verify(token: string): ApiKey | null {
      if (!token.startsWith("igw_")) return null;
      return (
        (byHash.get({ hash: hash(token) }) as ApiKey | null) ?? null
      );
    },
    revoke: (name: string) =>
      revoke.run({ name, now: Date.now() }).changes === 1,
  };
}

export type KeyStore = ReturnType<typeof createKeyStore>;
