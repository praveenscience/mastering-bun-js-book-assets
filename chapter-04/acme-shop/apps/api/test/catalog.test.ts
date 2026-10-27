import { expect, test } from "bun:test";
import { catalog } from "../src/catalog";

test("loads and validates every product", () => {
  expect(catalog).toHaveLength(3);
  expect(catalog[1]).toEqual({
    id: "A200",
    name: "Mug, ceramic",
    price: 8,
  });
});
