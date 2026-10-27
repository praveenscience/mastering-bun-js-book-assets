# Chapter 3: The Native Bundler and Transpiler

Code for Chapter 3 of *Mastering Bun.js for High-Performance JavaScript Applications*. Tested with Bun 1.4.3 and checked again with Bun 1.4.4.

| Folder | Section in the chapter | How to run |
| --- | --- | --- |
| `bundling/` | Bundling With bun build and Bun.build; Shrinking the Output | `bun build ./src/index.ts --outdir dist --target browser`; add `--splitting --minify --sourcemap=linked`; `bun build.ts`; `bun build-fail.ts`; `bun check-size.ts` (size budget) |
| `transpiler/` | Transpiling TypeScript and JSX | `bun transpile.ts` |
| `assets/` | Importing Data and Assets | `bun src/assets-demo.ts`; `bun build src/assets-demo.ts --outdir dist --target bun` |
| `html/` | Bundling an HTML Page | `bun build ./web/index.html --outdir dist-web --minify` |
| `config/` | Configuring the Output | `bun install`; `PUBLIC_API_URL=https://api.example.com SECRET_KEY=s3cret bun build ./src/flags.ts --define 'BUILD_VERSION="1.2.3"' --env='PUBLIC_*' --production --outfile out/flags.js`; `bun build src/server.ts --target bun --packages external --outfile out/server.js` |
| `plugins/` | Extending the Build With Plugins | `bun build-with-plugin.ts` then `bun dist/version.js` (needs a Git repository); `bun build-csv.ts` then `bun dist/catalog.js` |
| `macros/` | Running Code at Build Time With Macros | `bun build ./src/use-macro.ts --target bun --outfile dist/use-macro.js` (needs a Git repository) |
| `executable/` | Compiling Standalone Executables | `bun build --compile cli/notify.ts --outfile bin/notify`; `cli/notify-file.ts`; `bun build --compile cli/asset-read.ts --asset templates --outfile bin/asset-read`; cross-compile with `--target=bun-linux-x64` |
| `security/` | Securing the Build | `bun build-guarded.ts` (the checkout page is blocked) |
