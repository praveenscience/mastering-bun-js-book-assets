import type { Product } from "@acme/shared";

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function formatPrice(product: Product): string {
  const pounds = (toCents(product.price) / 100).toFixed(2);
  return `${product.name}: £${pounds}`;
}
