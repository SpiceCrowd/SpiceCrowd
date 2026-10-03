import { builtInPromotions } from "@/lib/promotionConfig";
import { couponToPromotion, offerToPromotion } from "@/lib/pricingService";
import { computeQuote, isAdvertisable, summarizePromotion, type CustomerContext, type Promotion, type QuoteLine } from "@/lib/promotions";

const guest: CustomerContext = { loggedIn: false, priorOrders: 0, usesByCode: {} };
const member: CustomerContext = { loggedIn: true, priorOrders: 0, usesByCode: {} };
const NOW = new Date("2026-10-03T10:00:00Z");

function cart(total: number, category = "Whole Spices"): QuoteLine[] {
  return [{ slug: "item", title: "Item", quantity: 1, price: total, lineTotal: total, category }];
}

const spice10 = couponToPromotion({
  code: "SPICE10", title: "Festival 10%", discountType: "percent", discountValue: 10, minOrder: 799,
  maxDiscount: 300, usageLimit: 500, usedCount: 38, expiresAt: "2026-10-06T16:10:31.752Z", status: "active",
});
const first150 = couponToPromotion({
  code: "FIRST150", title: "First 150", discountType: "flat", discountValue: 150, minOrder: 999,
  maxDiscount: null, usageLimit: 200, usedCount: 64, expiresAt: "2026-11-05T16:10:31.752Z", status: "active", customer: "first_order",
});
const all = [...builtInPromotions, spice10, first150];

function quote(total: number, extra: Partial<Parameters<typeof computeQuote>[0]> = {}) {
  return computeQuote({ lines: cart(total), promotions: all, shippingMethod: "standard", customer: guest, now: NOW, ...extra });
}

describe("automatic 10% threshold (min 999, inclusive)", () => {
  it.each([
    [998, 0], [999, 100], [1000, 100], [1001, 100], [5000, 500], [10000, 500],
  ])("subtotal ₹%i gets discount ₹%i", (subtotal, discount) => {
    const result = quote(subtotal);
    expect(result.discount).toBe(discount);
    expect(result.total).toBe(subtotal - discount + result.shipping.cost);
  });
});

describe("free shipping (₹500 after discounts, standard only)", () => {
  it.each([[499, 50], [500, 0], [501, 0]])("subtotal ₹%i pays ₹%i shipping", (subtotal, shipping) => {
    expect(quote(subtotal).shipping.cost).toBe(shipping);
  });

  it("never waives express shipping", () => {
    const result = quote(2000, { shippingMethod: "express" });
    expect(result.shipping.cost).toBe(150);
    expect(result.shipping.discount).toBe(0);
  });

  it("uses the post-discount subtotal against the threshold", () => {
    const strict: Promotion = { ...builtInPromotions[1], minOrder: 950 };
    const result = computeQuote({ lines: cart(999), promotions: [builtInPromotions[0], strict], shippingMethod: "standard", customer: guest, now: NOW });
    expect(result.discount).toBe(100);
    expect(result.shipping.cost).toBe(50);
    expect(result.nudges[0].remaining).toBe(51);
  });
});

describe("coupons and stacking", () => {
  it("rejects coupons below the minimum and unknown codes", () => {
    expect(quote(798, { couponCode: "SPICE10" }).coupon?.status).toBe("rejected");
    expect(quote(1000, { couponCode: "NOPE" }).coupon?.status).toBe("rejected");
  });

  it("applies a coupon when no automatic offer is active, capped at maxDiscount", () => {
    const result = quote(799, { couponCode: " spice10 ", promotions: [spice10] });
    expect(result.coupon).toMatchObject({ status: "applied", discount: 80 });
    expect(quote(5000, { couponCode: "SPICE10", promotions: [spice10] }).discount).toBe(300);
  });

  it("does not stack a coupon with the automatic discount; the better one wins", () => {
    const result = quote(5000, { couponCode: "SPICE10" });
    expect(result.discount).toBe(500);
    expect(result.coupon?.status).toBe("not_applied");
    expect(result.promotions.filter((p) => p.kind === "discount")).toHaveLength(1);
  });

  it("lets a coupon win when it saves more than the automatic offer", () => {
    const result = quote(1000, { couponCode: "FIRST150", customer: member });
    expect(result.discount).toBe(150);
    expect(result.coupon?.status).toBe("applied");
    expect(result.promotions.some((p) => p.id === "auto-10-off-999")).toBe(false);
  });

  it("stacks only when both promotions are stackable", () => {
    const stackA: Promotion = { ...builtInPromotions[0], id: "a", stackable: true };
    const stackB: Promotion = { ...spice10, stackable: true };
    const result = computeQuote({ lines: cart(1000), promotions: [stackA, stackB], couponCode: "SPICE10", shippingMethod: "standard", customer: guest, now: NOW });
    expect(result.discount).toBe(200);
    expect(result.coupon?.status).toBe("applied");
  });

  it("never discounts more than the subtotal", () => {
    const flat: Promotion = { ...first150, value: 5000, minOrder: 0, customer: "all" };
    expect(computeQuote({ lines: cart(100), promotions: [flat], couponCode: "FIRST150", shippingMethod: "standard", customer: guest, now: NOW }).discount).toBe(100);
  });
});

describe("customer eligibility, dates and limits", () => {
  it("requires sign-in and no prior orders for first-order coupons", () => {
    expect(quote(1000, { couponCode: "FIRST150" }).coupon?.message).toMatch(/Sign in/);
    expect(quote(1000, { couponCode: "FIRST150", customer: { ...member, priorOrders: 1 } }).coupon?.message).toMatch(/first order/);
  });

  it("rejects expired, not-yet-started, paused and exhausted coupons", () => {
    expect(quote(1000, { couponCode: "SPICE10", now: new Date("2026-10-07T00:00:00Z") }).coupon?.status).toBe("rejected");
    const future = { ...spice10, startsAt: "2026-12-01" };
    expect(computeQuote({ lines: cart(1000), promotions: [future], couponCode: "SPICE10", shippingMethod: "standard", customer: guest, now: NOW }).coupon?.status).toBe("rejected");
    expect(computeQuote({ lines: cart(1000), promotions: [{ ...spice10, status: "paused" }], couponCode: "SPICE10", shippingMethod: "standard", customer: guest, now: NOW }).coupon?.status).toBe("rejected");
    expect(computeQuote({ lines: cart(1000), promotions: [{ ...spice10, usedCount: 500 }], couponCode: "SPICE10", shippingMethod: "standard", customer: guest, now: NOW }).coupon?.status).toBe("rejected");
  });

  it("enforces per-customer limits", () => {
    const limited = { ...spice10, perCustomerLimit: 1 };
    const result = computeQuote({ lines: cart(1000), promotions: [limited], couponCode: "SPICE10", shippingMethod: "standard", customer: { ...member, usesByCode: { SPICE10: 1 } }, now: NOW });
    expect(result.coupon?.status).toBe("rejected");
  });

  it("scopes discounts to categories and compares the minimum against eligible items only", () => {
    const scoped: Promotion = { ...builtInPromotions[0], id: "cat", appliesTo: { categories: ["Powders"] }, minOrder: 500 };
    const lines: QuoteLine[] = [
      { slug: "a", title: "A", quantity: 1, price: 400, lineTotal: 400, category: "Powders" },
      { slug: "b", title: "B", quantity: 1, price: 900, lineTotal: 900, category: "Whole Spices" },
    ];
    const run = (l: QuoteLine[]) => computeQuote({ lines: l, promotions: [scoped], shippingMethod: "standard", customer: guest, now: NOW });
    expect(run(lines).discount).toBe(0);
    expect(run([{ ...lines[0], price: 600, lineTotal: 600 }, lines[1]]).discount).toBe(60);
  });
});

describe("advertising only live rules", () => {
  it("lists only advertisable promotions and generates eligibility text", () => {
    const bogo = offerToPromotion({ id: "1", title: "BOGO", offerType: "bogo", value: 1, minOrder: 0, startAt: "2026-01-01", endAt: "2027-01-01", status: "active" });
    const draft = offerToPromotion({ id: "2", title: "Draft", offerType: "percent", value: 5, minOrder: 0, startAt: "2026-01-01", endAt: "2027-01-01", status: "draft" });
    expect(isAdvertisable(bogo, NOW)).toBe(false);
    expect(isAdvertisable(draft, NOW)).toBe(false);
    expect(isAdvertisable(spice10, NOW)).toBe(false); // coupons are private unless flagged public
    expect(builtInPromotions.every((promo) => isAdvertisable(promo, NOW))).toBe(true);
    expect(summarizePromotion(builtInPromotions[0]).headline).toBe("10% off orders of ₹999 or more");
    expect(summarizePromotion(builtInPromotions[1]).headline).toBe("Free standard shipping on orders of ₹500 or more");
    expect(summarizePromotion(builtInPromotions[0]).conditions).toContain("Cannot be combined with other discounts");
  });
});
