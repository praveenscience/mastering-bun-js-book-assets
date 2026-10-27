// An ES module with top-level await.
export const settings = await Promise.resolve({ currency: "GBP" });
