import { plugin } from "bun";
import { csvLoader } from "./csv-plugin";
import products from "./data/products.csv";

plugin(csvLoader);
console.log(typeof products, products.length);
