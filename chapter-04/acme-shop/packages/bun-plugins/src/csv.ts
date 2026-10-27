import type { BunPlugin } from "bun";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

export const csvLoader: BunPlugin = {
  name: "csv-loader",
  setup(build) {
    build.onLoad({ filter: /\.csv$/ }, async (args) => {
      const [header, ...rows] = (await Bun.file(args.path).text())
        .trim()
        .split("\n");
      const keys = parseCsvLine(header!);
      const records = rows.map((row) =>
        Object.fromEntries(
          parseCsvLine(row).map((value, i) => [keys[i], value]),
        ),
      );
      return {
        contents: `export default ${JSON.stringify(records)};`,
        loader: "js",
      };
    });
  },
};
