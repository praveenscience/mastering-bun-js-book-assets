const request = require("supertest");
const { setup, login } = require("./helpers");

describe("billing api", () => {
  let app;
  beforeEach(() => ({ app } = setup()));

  test("rejects a wrong password", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: "ada@example.com", password: "nope" });
    expect(res.status).toBe(401);
  });

  test("creates and reads an invoice", async () => {
    const token = await login(app);
    const created = await request(app)
      .post("/invoices")
      .set("authorization", `Bearer ${token}`)
      .send({ lines: [{ sku: "A", qty: 3, unitCents: 250 }] });
    expect(created.status).toBe(201);
    expect(created.body.total).toBe(750);

    const read = await request(app)
      .get(`/invoices/${created.body.id}`)
      .set("authorization", `Bearer ${token}`);
    expect(read.body.lines).toEqual([
      { sku: "A", qty: 3, unitCents: 250 },
    ]);
  });

  test("requires a token", async () => {
    const res = await request(app).get("/invoices/1");
    expect(res.status).toBe(401);
  });

  test("validates invoice lines", async () => {
    const token = await login(app);
    const res = await request(app)
      .post("/invoices")
      .set("authorization", `Bearer ${token}`)
      .send({ lines: [] });
    expect(res.status).toBe(400);
  });

  test("reports revenue per day", async () => {
    const token = await login(app);
    for (const unitCents of [100, 200]) {
      await request(app)
        .post("/invoices")
        .set("authorization", `Bearer ${token}`)
        .send({ lines: [{ sku: "A", qty: 1, unitCents }] });
    }
    const res = await request(app).get("/reports/revenue");
    expect(res.body.days).toHaveLength(1);
    expect(res.body.days[0]).toMatchObject({ cents: 300, invoices: 2 });
  });
});
