import express from "express";

const app = express();

app.get("/", (request, response) => {
  response.json({ runtime: "bun", version: Bun.version });
});

app.listen(3001, () => {
  console.log("Express running on Bun at http://localhost:3001");
});
