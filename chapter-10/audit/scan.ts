// Audits a Node.js project before a move to Bun and prints a risk
// list. Usage: bun audit/scan.ts <project-dir> (after npm install)
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { builtinModules } from "node:module";
import { RULES, type Rule } from "./rules";

type Finding = { level: Rule["level"]; where: string; text: string };

const root = Bun.argv[2] ?? ".";
const pkg = await Bun.file(join(root, "package.json")).json();
const findings: Finding[] = [];
const add = (level: Finding["level"], where: string, text: string) =>
  findings.push({ level, where, text });

const SKIP = /node_modules|\.git|dist/;

function files(dir: string, skip = SKIP): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (skip.test(name)) return [];
    return statSync(path).isDirectory() ? files(path, skip) : [path];
  });
}

// 1. Our own code: imports, built-in modules, and risky patterns.
const used = new Set<string>();
const builtins = new Map<string, number>();
const sources = files(root).filter((f) => /\.[cm]?[jt]s$/.test(f));
for (const file of sources) {
  const code = await Bun.file(file).text();
  const loader = file.endsWith(".ts") ? "ts" : "js";
  const where = relative(root, file);
  const transpiler = new Bun.Transpiler({ loader });
  for (const { path } of transpiler.scanImports(code)) {
    const name = path.replace(/^node:/, "");
    if (builtinModules.includes(name.split("/")[0]!)) {
      builtins.set(name, (builtins.get(name) ?? 0) + 1);
    } else if (!path.startsWith(".")) {
      const parts = path.split("/");
      const scoped = path.startsWith("@");
      used.add(scoped ? parts.slice(0, 2).join("/") : parts[0]!);
    }
  }
  for (const rule of RULES.filter((r) => r.scope === "source")) {
    if (rule.pattern.test(code)) add(rule.level, where, rule.text);
  }
}

// 2. Dependencies: unused ones, native addons, install scripts,
// and risky patterns inside their code.
const direct = { ...pkg.dependencies, ...pkg.devDependencies };
const tools = new Set(["jest", "nodemon", "typescript", "eslint"]);
for (const name of Object.keys(direct)) {
  if (!used.has(name) && !tools.has(name)) {
    add("low", name, "declared but never imported by our code");
  }
}
const modules = join(root, "node_modules");
const installed = readdirSync(modules).flatMap((n) => {
  if (n.startsWith(".")) return [];
  if (!n.startsWith("@")) return [n];
  return readdirSync(join(modules, n)).map((s) => `${n}/${s}`);
});
for (const name of installed) {
  const dir = join(modules, name);
  const meta = await Bun.file(join(dir, "package.json")).json();
  const scripts = meta.scripts ?? {};
  const all = files(dir, /node_modules|test|docs?|examples?/);
  if (meta.gypfile || all.some((f) => f.endsWith(".node"))) {
    add("medium", name, "native addon (Node-API): test it on Bun");
  }
  if (scripts.install || scripts.postinstall || scripts.preinstall) {
    add("medium", name, "install script: needs trustedDependencies");
  }
  for (const file of all.filter((f) => /\.[cm]?js$/.test(f))) {
    const code = await Bun.file(file).text();
    for (const rule of RULES.filter((r) => r.scope === "package")) {
      if (rule.pattern.test(code)) {
        add(rule.level, `${name} (${relative(dir, file)})`, rule.text);
      }
    }
  }
}

// 3. Report, most serious first.
const order = { high: 0, medium: 1, low: 2 };
findings.sort((a, b) => order[a.level] - order[b.level]);
console.log(`# Migration audit: ${pkg.name}@${pkg.version}\n`);
console.log(`Source files: ${sources.length}`);
const names = [...builtins.keys()].sort().join(", ");
console.log(`Built-in modules: ${names}\n`);
for (const f of findings) {
  console.log(`- [${f.level}] ${f.where}: ${f.text}`);
}
