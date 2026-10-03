import { POST as createPayment } from "@/app/api/payments/route";
import { POST as createOrder } from "@/app/api/orders/route";

describe("production checkout safety", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const runtimeEnv = process.env as Record<string, string | undefined>;

  beforeEach(() => {
    runtimeEnv.NODE_ENV = "production";
  });

  afterAll(() => {
    runtimeEnv.NODE_ENV = originalNodeEnv;
  });

  it("rejects dummy payment creation in production", async () => {
    const response = await createPayment(new Request("http://localhost/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1 }),
    }));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false });
  });

  it("rejects order creation in production before accepting client totals", async () => {
    const response = await createOrder(new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ slug: "turmeric", price: 0 }], total: 1 }),
    }));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false });
  });
});