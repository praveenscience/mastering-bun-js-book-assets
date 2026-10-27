function applyTax(pence: number) {
  const rate = 0.2;
  const tax = Math.round(pence * rate);
  return pence + tax;
}

const server = Bun.serve({
  port: 3005,
  hostname: "127.0.0.1",
  fetch(req) {
    const pence = Number(new URL(req.url).searchParams.get("p"));
    return new Response(String(applyTax(pence)));
  },
});
console.log(`Try ${server.url}?p=1000`);

// A tiny server to practise breakpoints on. Start it with:
//   bun --inspect debug/tax.ts
