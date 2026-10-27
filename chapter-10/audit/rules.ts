// Patterns that deserve a look before moving to Bun 1.4. Each rule
// comes from Bun's Node.js compatibility page or from our tests.
export type Rule = {
  scope: "source" | "package";
  level: "high" | "medium" | "low";
  pattern: RegExp;
  text: string;
};

export const RULES: Rule[] = [
  {
    scope: "package",
    level: "high",
    pattern: /\bcreateHook\s*\(/,
    text: "async_hooks.createHook: hooks never fire in Bun",
  },
  {
    scope: "source",
    level: "high",
    pattern: /\bcreateHook\s*\(/,
    text: "async_hooks.createHook: hooks never fire in Bun",
  },
  {
    scope: "source",
    level: "medium",
    pattern: /require\(["'](node:)?cluster["']\)/,
    text: "cluster: HTTP load balancing works on Linux only",
  },
  {
    scope: "package",
    level: "medium",
    pattern: /entryTypes:\s*\[\s*["']gc["']/,
    text: "observes gc entries: Bun never emits them",
  },
  {
    scope: "package",
    level: "low",
    pattern: /process\.binding\(/,
    text: "process.binding: often a guarded fallback; check it",
  },
  {
    scope: "source",
    level: "medium",
    pattern: /process\.binding\(|require\.extensions|module\._load/,
    text: "Node internals: check each use against Bun's docs",
  },
  {
    scope: "source",
    level: "low",
    pattern: /eventLoopUtilization|getHeapStatistics/,
    text: "runtime metrics differ (JavaScriptCore heap, ELU zeros)",
  },
  {
    scope: "source",
    level: "low",
    pattern: /process\.version|process\.versions\.node/,
    text: "reads the Node version: Bun reports a Node 26 version",
  },
];
