// A minimal Prometheus registry: counters and a histogram that the
// code updates, plus gauges read from the runtime at scrape time.
import { heapStats } from "bun:jsc";

type Labels = Record<string, string>;
type Histogram = {
  name: string;
  labels: string;
  counts: number[];
  n: number;
  sum: number;
};
const key = (labels: Labels) =>
  Object.entries(labels)
    .map(([k, v]) => `${k}="${v}"`)
    .join(",");

export class Metrics {
  private counters = new Map<string, Map<string, number>>();
  private buckets = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5];
  private hist = new Map<string, Histogram>();
  gauges: Record<string, () => number> = {};

  inc(name: string, labels: Labels = {}, by = 1) {
    const series = this.counters.get(name) ?? new Map();
    series.set(key(labels), (series.get(key(labels)) ?? 0) + by);
    this.counters.set(name, series);
  }

  observe(name: string, labels: Labels, seconds: number) {
    const id = `${name}{${key(labels)}}`;
    const h = this.hist.get(id) ?? {
      name,
      labels: key(labels),
      counts: this.buckets.map(() => 0),
      n: 0,
      sum: 0,
    };
    this.buckets.forEach((le, i) => {
      if (seconds <= le) h.counts[i]!++;
    });
    h.n++;
    h.sum += seconds;
    this.hist.set(id, h);
  }

  render(): string {
    const out: string[] = [];
    for (const [name, series] of this.counters) {
      out.push(`# TYPE ${name} counter`);
      for (const [l, v] of series) {
        out.push(l ? `${name}{${l}} ${v}` : `${name} ${v}`);
      }
    }
    for (const h of this.hist.values()) {
      const l = h.labels ? `${h.labels},` : "";
      this.buckets.forEach((le, i) => {
        out.push(`${h.name}_bucket{${l}le="${le}"} ${h.counts[i]}`);
      });
      out.push(`${h.name}_bucket{${l}le="+Inf"} ${h.n}`);
      out.push(`${h.name}_count{${h.labels}} ${h.n}`);
      out.push(`${h.name}_sum{${h.labels}} ${h.sum}`);
    }
    const mem = process.memoryUsage();
    const gauges: Record<string, number> = {
      process_resident_memory_bytes: mem.rss,
      bun_heap_size_bytes: heapStats().heapSize,
      bun_heap_object_count: heapStats().objectCount,
      ...Object.fromEntries(
        Object.entries(this.gauges).map(([k, f]) => [k, f()]),
      ),
    };
    for (const [name, value] of Object.entries(gauges)) {
      out.push(`# TYPE ${name} gauge`, `${name} ${value}`);
    }
    return out.join("\n") + "\n";
  }
}
