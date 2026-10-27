import type { BunPlugin } from "bun";

const ENV = String.raw`(?:process\.env|Bun\.env|import\.meta\.env)`;
const KEY = String.raw`(\w*(?:SECRET|PASSWORD|TOKEN|PRIVATE_KEY)\w*)`;
const FORBIDDEN = new RegExp(String.raw`\b${ENV}\.${KEY}`, "g");

export const noSecretsInBrowser: BunPlugin = {
  name: "no-secrets-in-browser",
  setup(build) {
    build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
      if (args.path.includes("/node_modules/")) return undefined;
      const source = await Bun.file(args.path).text();
      const found = [...source.matchAll(FORBIDDEN)].map((m) => m[1]);
      if (found.length > 0) {
        const names = found.join(", ");
        const reason = "secrets must not reach a browser bundle";
        throw new Error(`${args.path} reads ${names}; ${reason}`);
      }
      return { contents: source, loader: args.loader };
    });
  },
};
