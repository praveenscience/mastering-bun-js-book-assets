import { add } from "./math";

const total = add(2, 3);
console.log("total", total);

document
  .querySelector("#report")
  ?.addEventListener("click", async () => {
    const { buildReport } = await import("./report");
    console.log(buildReport(total));
  });
