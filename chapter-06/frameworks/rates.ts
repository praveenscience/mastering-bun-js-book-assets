// Shared by both apps, so they differ only in framework code.
export const rates: Record<string, { bid: number; ask: number }> = {
  GBPUSD: { bid: 1.2699, ask: 1.2702 },
  EURUSD: { bid: 1.0799, ask: 1.0801 },
};

let nextId = 0;
export const newAlertId = () => `alert_${++nextId}`;
