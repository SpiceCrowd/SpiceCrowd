import { priceOrderItems } from "@/lib/checkoutPricing";
import { shippingRates } from "@/lib/promotionConfig";

describe("trusted checkout pricing", () => {
  it("uses catalog variant prices instead of submitted client prices", () => {
    const priced = priceOrderItems([{
      slug: "kolli-hills-turmeric",
      variantId: "KOLLI-HILLS-TURMERIC-100G",
      quantity: 2,
      price: 1,
      title: "Forged title",
    }]);

    expect(priced.error).toBeUndefined();
    expect(priced.items?.[0].price).toBe(89);
    expect(priced.items?.[0].title).toContain("Kolli Hills Turmeric");
    expect(priced.subtotal).toBe(178);
  });

  it("rejects unknown products, variants, and invalid quantities", () => {
    expect(priceOrderItems([{ slug: "combo-fake", quantity: 1 }]).error).toMatch(/unavailable/);
    expect(priceOrderItems([{ slug: "kolli-hills-turmeric", variantId: "FAKE", quantity: 1 }]).error).toMatch(/size/);
    expect(priceOrderItems([{ slug: "kolli-hills-turmeric", quantity: 0 }]).error).toMatch(/Quantity/);
  });
});

describe("shipping rates", () => {
  it("keeps the configured base standard and express prices", () => {
    expect(shippingRates.standard).toBe(50);
    expect(shippingRates.express).toBe(150);
  });
});
