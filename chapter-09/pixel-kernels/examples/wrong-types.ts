// What bun:ffi does with arguments that do not fit the signature.
import { kernels } from "../src/native";

const k = kernels.symbols;
const cases: [string, () => unknown][] = [
  ["plain array as ptr", () => k.grayscale([1, 2, 3, 4] as any, 4)],
  ["string as ptr", () => k.grayscale("abcd" as any, 4)],
  ["string as i32", () => k.add("7" as any, 1)],
  ["1.9 as i32", () => k.add(1.9, 1)],
  ["2 ** 31 - 1 plus 1", () => k.add(2 ** 31 - 1, 1)],
  ["one argument missing", () => (k.add as any)(41)],
  ["null pointer", () => k.box_blur(null, null, 1, 1, 1)],
];
for (const [name, call] of cases) {
  try {
    console.log(`${name}: returned ${call()}`);
  } catch (e) {
    console.log(`${name}: threw "${(e as Error).message}"`);
  }
}
