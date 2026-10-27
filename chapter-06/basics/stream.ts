// Streams a large CSV export row by row, without building it in memory.
Bun.serve({
  port: 3000,
  hostname: "127.0.0.1",
  routes: {
    "/export.csv": () =>
      new Response(
        async function* () {
          yield "seq,pair,bid\n";
          for (let seq = 1; seq <= 100_000; seq++) {
            yield `${seq},GBPUSD,${(1.27 + seq / 1e7).toFixed(5)}\n`;
          }
        },
        { headers: { "Content-Type": "text/csv" } },
      ),
  },
});
