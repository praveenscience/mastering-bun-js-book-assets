# Chapter 4: Workspaces, Monorepos, and the Plugin Ecosystem

Code for Chapter 4 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.4.

| Folder | Section in the chapter | How to run |
| --- | --- | --- |
| `acme-shop/` | Setting Up Bun Workspaces; Sharing Code and Dependencies Across Packages; Running Scripts Across the Workspace | `bun install`, then `bun run build`, `bun run test`, `bun run typecheck`; `cd apps/api && bun run start` and open `/products/labels`; `bun --filter '@acme/api...' build`; `bun install --filter '@acme/api...'` |
| `experiments/` | Catching Phantom Dependencies | Copy `phantom.ts` into `acme-shop/apps/api/src/`, run it from `apps/api`, then try again after `bun install --linker hoisted`. Delete it and run `bun install` afterwards |
| `registry/` | Versioning and Publishing From a Monorepo | `bun registry/mock-registry.ts` in one terminal; from `acme-shop`, `NPM_CONFIG_TOKEN=local-test bun publish --recursive --registry http://localhost:4873/` |
| `runtime-plugins/` | Writing Runtime Plugins and Loaders | `bun app.ts` (no plugin), `bun --preload ./preload.ts app.ts`, `bun too-late.ts`, `bun in-time.ts`, `bun --preload ./preload-count.ts count.ts`, `bun virtual.ts`; add `--disallow-code-generation-from-strings=strict` to compare the two plugin forms |

The packages in `acme-shop` publish TypeScript source, which suits Bun consumers. Add a JavaScript build step before publishing them for Node.js.
