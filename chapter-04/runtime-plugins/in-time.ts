import { plugin } from "bun";
import { csvLoader } from "./csv-plugin";

plugin(csvLoader);
const { default: products } = await import("./data/products.csv");
console.log(typeof products, products.length);
