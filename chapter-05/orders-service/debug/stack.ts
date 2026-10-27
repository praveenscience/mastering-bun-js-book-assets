async function loadStock(sku: string) {
  await Bun.sleep(1);
  throw new Error(`No stock record for ${sku}`);
}

async function reserve(sku: string) {
  return await loadStock(sku); // try removing "await"
}

async function checkout() {
  await reserve("MUG-01");
}

checkout().catch((err) => console.log(err.stack));
