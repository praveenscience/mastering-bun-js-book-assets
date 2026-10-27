import { $ } from "bun";

const name = "report; rm -rf /";
console.log(await $`echo ${name}`.text());
