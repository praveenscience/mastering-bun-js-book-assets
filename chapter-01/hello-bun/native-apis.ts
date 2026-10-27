// Read a file lazily and parse it as JSON
const pkgFile = Bun.file("package.json");
console.log("size in bytes:", pkgFile.size);
const pkg = await pkgFile.json();
console.log("project name:", pkg.name);

// Hash and verify a password with a secure default algorithm
const hash = await Bun.password.hash("correct horse battery staple");
const ok = await Bun.password.verify(
  "correct horse battery staple",
  hash,
);
console.log("password verified:", ok);

// Fast non-cryptographic hash, useful for cache keys
console.log("cache key:", Bun.hash("user:42"));
