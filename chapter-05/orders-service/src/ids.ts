// Random IDs never collide in practice, even for orders placed
// in the same millisecond. A timestamp-based ID did collide.
export const newOrderId = () => `ord_${crypto.randomUUID()}`;
