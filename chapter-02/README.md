# Chapter 2: A Bun-Native Development Workflow and Package Management

Code for Chapter 2 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.3 and checked again with Bun 1.4.4.

| Folder | Section in the chapter | How to run |
| --- | --- | --- |
| `scaffold/` | Building the Project Scaffold (the starting point for Chapters 3 to 12) | `bun install`, `cp .env.example .env`, then `bun run dev`, `bun run verify`, `bun run doctor` |
| `private-registry/` | Installing From a Private Registry | `bunfig.toml` is an example to adapt; `fake-registry.ts` shows the scope URL and token Bun sends (steps in the file) |
| `patching/` | Patching a Dependency With bun patch | Follow `STEPS.md` |
| `ci/verify.yml` | Installing Reproducibly in CI | Copy to `.github/workflows/verify.yml` in your repository |
| `typescript/` | Running TypeScript and JSX Without a Build Step | `bun install`; `bun bad.ts` (runs), `bun check` (reports the error), `bun --check bad.ts` (refuses to run), `bun page.tsx` |
| `testing/` | Running Your First Tests With bun test | `bun test` |
| `reload/` | Reloading Code With Watch and Hot Mode | `bun --hot hot.ts` or `bun --watch hot.ts`, then edit and save the file |
| `env-demo/` | Managing Environment Variables and Configuration | `bun env.ts`, `NODE_ENV=production bun env.ts`, `bun test` (the `.env.local` here is demo data only) |
| `scripting/` | Scripting With Bun.spawn and the Bun Shell | `bun spawn.ts`, `bun shell.ts`, `bun injection.ts` |
| `install-timing/` | Measuring Cold and Warm Installs | `./time-installs.sh` (needs Bun, npm, and perl; takes about a minute) |
