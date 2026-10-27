export type Charge = { id: string; status: "succeeded" | "declined" };

export type Payments = {
  charge(amountPence: number, cardToken: string): Promise<Charge>;
};

export function createPayments(baseUrl: string, apiKey: string) {
  return {
    async charge(amountPence: number, cardToken: string) {
      const res = await fetch(`${baseUrl}/charges`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ amount: amountPence, cardToken }),
      });
      if (!res.ok) throw new Error(`Payment API ${res.status}`);
      return (await res.json()) as Charge;
    },
  } satisfies Payments;
}
