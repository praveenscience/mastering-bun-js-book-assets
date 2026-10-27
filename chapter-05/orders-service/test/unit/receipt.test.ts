import {
  afterAll,
  beforeAll,
  expect,
  setSystemTime,
  test,
} from "bun:test";
import { renderReceipt } from "../../src/receipt";

const order = {
  id: "ord_1",
  customerId: "alice",
  total: 3417,
  chargeId: "ch_1",
  createdAt: "2026-10-26T09:00:00.000Z",
};

beforeAll(() => setSystemTime(new Date("2026-10-26T09:00:00Z")));
afterAll(() => setSystemTime());

test("receipt layout", () => {
  const text = renderReceipt(order, ["2 x Mug", "1 x T-shirt"]);
  expect(text).toMatchSnapshot();
});

test("total line", () => {
  const last = renderReceipt(order, []).split("\n").at(-1);
  expect(last).toMatchInlineSnapshot(`"Total £34.17"`);
});
