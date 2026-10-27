const transpiler = new Bun.Transpiler({ loader: "ts" });

const source = `import { z } from "zod";
import type { User } from "./types";
export const port: number = 3000;
export function greet(name: string): string { return "hi " + name; }`;

console.log(transpiler.transformSync(source));
console.log(transpiler.scan(source));
