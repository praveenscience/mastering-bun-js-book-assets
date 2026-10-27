const request = require("supertest");
const { setup, login } = require("./helpers");

test("log lines carry the request id", async () => {
  const { app } = setup();
  const lines = [];
  const spy = jest
    .spyOn(process.stdout, "write")
    .mockImplementation((chunk) => {
      lines.push(String(chunk));
      return true;
    });
  try {
    await request(app)
      .post("/login")
      .set("x-request-id", "req-42")
      .send({ email: "ada@example.com", password: "password1" });
  } finally {
    spy.mockRestore();
  }
  const entry = lines
    .map((l) => JSON.parse(l))
    .find((e) => e.msg === "login");
  expect(entry).toMatchObject({ level: "info", requestId: "req-42" });
});
