import { parseArgs } from "node:util";
import template from "../templates/shipped.txt";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    name: { type: "string", default: "customer" },
    id: { type: "string", default: "0000" },
  },
});

console.log(
  template
    .replace("{{name}}", values.name!)
    .replace("{{id}}", values.id!)
    .trim(),
);
