declare module "*products.csv" {
  const rows: { sku: string; name: string; price: string }[];
  export default rows;
}
