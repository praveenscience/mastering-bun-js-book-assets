import { connectLive } from "../client/live-client";
import type { Rate } from "../src/protocol";

const rows = document.getElementById("rates")!;
const status = document.getElementById("status")!;

function show(rate: Rate) {
  let row = document.getElementById(rate.pair);
  if (!row) {
    row = rows.appendChild(document.createElement("tr"));
    row.id = rate.pair;
  }
  row.innerHTML = "";
  for (const value of [rate.pair, rate.bid, rate.ask, rate.seq]) {
    row.appendChild(document.createElement("td")).textContent =
      String(value);
  }
}

connectLive({
  baseUrl: location.origin,
  token: "demo-token", // demo only: never ship real tokens in a page
  pairs: ["GBPUSD", "EURUSD", "USDJPY", "EURGBP"],
  onMessage(msg) {
    if (msg.type === "welcome") status.textContent = "live";
    if (msg.type === "rate") show(msg);
    if (msg.type === "snapshot") msg.rates.forEach(show);
  },
});
