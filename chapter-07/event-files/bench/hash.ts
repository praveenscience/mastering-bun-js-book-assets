// SHA-256 of a file, computed as it streams.
const hasher = new Bun.CryptoHasher("sha256");
for await (const chunk of Bun.file(process.argv[2]!).stream()) {
  hasher.update(chunk);
}
console.log(hasher.digest("hex"));
