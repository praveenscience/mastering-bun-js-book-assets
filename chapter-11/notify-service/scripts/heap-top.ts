// Summarises a V8-format heap snapshot from Bun, or the growth
// between two, and shows what keeps the biggest group alive.
// Usage: bun scripts/heap-top.ts before.heapsnapshot [after...]
type Snapshot = {
  snapshot: {
    meta: {
      node_fields: string[];
      edge_fields: string[];
      node_types: [string[]];
      edge_types: [string[]];
    };
  };
  nodes: number[];
  edges: number[];
  strings: string[];
};

async function load(path: string) {
  const s: Snapshot = await Bun.file(path).json();
  const nf = s.snapshot.meta.node_fields.length;
  const ef = s.snapshot.meta.edge_fields.length;
  const types = s.snapshot.meta.node_types[0];
  const groups = new Map<
    string,
    { count: number; bytes: number; biggest: number; size: number }
  >();
  for (let i = 0; i < s.nodes.length; i += nf) {
    const type = types[s.nodes[i]!]!;
    const name =
      type === "string" ? "(string)" : s.strings[s.nodes[i + 1]!]!;
    const key = `${type}: ${name.slice(0, 40)}`;
    const g = groups.get(key) ?? {
      count: 0,
      bytes: 0,
      biggest: i,
      size: -1,
    };
    g.count++;
    g.bytes += s.nodes[i + 3]!;
    if (s.nodes[i + 3]! > g.size) {
      g.size = s.nodes[i + 3]!;
      g.biggest = i;
    }
    groups.set(key, g);
  }
  return { s, nf, ef, types, groups };
}

// Walks from one node back towards a GC root along retaining edges.
function retainers(h: Awaited<ReturnType<typeof load>>, start: number) {
  const { s, nf, ef } = h;
  const edgeTypes = s.snapshot.meta.edge_types[0];
  const back = new Map<number, [number, string]>();
  let e = 0;
  for (let i = 0; i < s.nodes.length; i += nf) {
    for (let k = 0; k < s.nodes[i + 4]!; k++, e += ef) {
      const type = edgeTypes[s.edges[e]!];
      if (type === "weak") continue;
      const label =
        type === "element" || type === "hidden"
          ? `[${s.edges[e + 1]}]`
          : s.strings[s.edges[e + 1]!]!;
      const to = s.edges[e + 2]!;
      if (!back.has(to)) back.set(to, [i, label]);
    }
  }
  const path: string[] = [];
  for (let at = start, hops = 0; back.has(at) && hops < 8; hops++) {
    const [from, label] = back.get(at)!;
    const owner = s.strings[s.nodes[from + 1]!]!.slice(0, 30);
    path.push(`${label} <- ${owner}`);
    at = from;
  }
  return path;
}

const [first, second] = Bun.argv.slice(2);
if (!first) throw new Error("usage: heap-top.ts a.heapsnapshot [b]");
const a = await load(first);
const b = second ? await load(second) : undefined;
const rows = [...(b ?? a).groups]
  .map(([key, g]) => {
    const before = b ? a.groups.get(key) : undefined;
    return {
      key,
      count: g.count - (before?.count ?? 0),
      bytes: g.bytes - (before?.bytes ?? 0),
      biggest: g.biggest,
    };
  })
  .sort((x, y) => y.bytes - x.bytes)
  .slice(0, 8);

console.log(b ? "Growth between snapshots:" : "Largest groups:");
for (const r of rows) {
  const mb = (r.bytes / 2 ** 20).toFixed(1).padStart(6);
  console.log(`${mb} MB ${String(r.count).padStart(9)}  ${r.key}`);
}
// The single largest object in the fastest-growing group is usually
// the storage of the collection that leaks.
const top = rows[0]!;
console.log(`\nThe largest ${top.key} object is retained by:`);
for (const line of retainers(b ?? a, top.biggest)) {
  console.log(`  ${line}`);
}
