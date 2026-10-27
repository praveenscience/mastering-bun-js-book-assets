// A stand-in payment provider for local runs: every charge succeeds.
//   bun debug/fake-payments.ts   (then, in another terminal, bun start)
let next = 0;
Bun.serve({
  port: 4010,
  hostname: "127.0.0.1",
  routes: {
    "/charges": {
      POST: () =>
        Response.json({ id: `ch_${++next}`, status: "succeeded" }),
    },
  },
});
console.log("Fake payments on http://127.0.0.1:4010");
