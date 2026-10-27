import products from "../data/products.csv";

for (const product of products) {
  console.log(
    `${product.sku}  ${product.name.padEnd(14)} ${product.price}`,
  );
}
