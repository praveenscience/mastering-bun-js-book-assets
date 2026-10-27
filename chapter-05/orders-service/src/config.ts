type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Merges like Helm values: maps merge key by key, but any other
// value, lists included, replaces the base value completely.
export function mergeConfig(base: Obj, overlay: Obj): Obj {
  const out: Obj = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    out[key] =
      isObj(value) && isObj(base[key])
        ? mergeConfig(base[key] as Obj, value)
        : value;
  }
  return out;
}

export async function loadConfig(env: string) {
  const read = (name: string) =>
    Bun.file(`${import.meta.dir}/../config/${name}.yaml`).text();
  const base = Bun.YAML.parse(await read("base")) as Obj;
  if (env === "base") return base;
  const overlay = Bun.YAML.parse(await read(env)) as Obj;
  return mergeConfig(base, overlay);
}
