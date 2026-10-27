# Patching a dependency with bun patch

1. `bun install`
2. `bun patch ms` (Bun swaps node_modules/ms for a private, editable copy)
3. Edit `node_modules/ms/index.js`
4. `bun patch --commit ms` (writes `patches/ms@2.1.3.patch` and adds `patchedDependencies` to package.json)
5. Commit `patches/`, `package.json`, and `bun.lock`
6. Check: `rm -rf node_modules && bun install`, then confirm your change is back

Remember: a patch belongs to one exact version. After upgrading `ms`, the old patch is no longer applied and Bun does not warn you.
