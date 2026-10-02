import { calculateOrderTotal } from "@/lib/orderUtils";
import { calculateCartTotals } from "@/lib/cart";
import { getProducts, inferProductCategory, matchesProductQuery, normalizeSizeOptions } from "@/lib/products";

describe("calculateOrderTotal", () => {
  it("applies SPICE10 coupon and GST", () => {
    const res = calculateOrderTotal(1000, "SPICE10", "22AAAAA0000A1Z5", 50);
    // subtotal 1000, 10% discount = 100, tax on 900 = 162, delivery 50, total = 1000-100+162+50 = 1112
    expect(res.discount).toBe(100);
    expect(res.tax).toBe(162);
    expect(res.total).toBe(1112);
  });

  it("applies FIRST20 coupon without GST", () => {
    const res = calculateOrderTotal(500, "FIRST20", null, 99);
    // 20% of 500 = 100 discount, tax 0, total = 500-100+99 = 499
    expect(res.discount).toBe(100);
    expect(res.tax).toBe(0);
    expect(res.total).toBe(499);
  });

  it("uses a configured product tax rate when GSTIN is supplied", () => {
    const res = calculateOrderTotal(1000, undefined, "22AAAAA0000A1Z5", 50, 5);
    expect(res.tax).toBe(50);
    expect(res.total).toBe(1100);
  });
});

describe("catalog filtering", () => {
  it("matches products by origin and derived category", () => {
    const products = getProducts();
    const turmeric = products.find((product) => product.slug === "kolli-hills-turmeric");
    const groundPepper = products.find((product) => product.slug === "kolli-hills-black-pepper-powder");

    expect(turmeric).toBeTruthy();
    expect(inferProductCategory(turmeric!)).toBe("Whole Spices");
    expect(matchesProductQuery(turmeric!, {
      category: "Whole Spices",
      origin: "Kolli Hills, Tamil Nadu",
      q: "turmeric",
      variant: null,
    })).toBe(true);

    expect(groundPepper).toBeTruthy();
    expect(inferProductCategory(groundPepper!)).toBe("Powders");
    expect(matchesProductQuery(groundPepper!, {
      category: "Powders",
      origin: null,
      q: "black pepper",
      variant: null,
    })).toBe(true);
  });
});

describe("calculateCartTotals", () => {
  it("adds item totals and shipping into one checkout total", () => {
    const totals = calculateCartTotals([
      { slug: "a", title: "A", price: 60, priceLabel: "₹60", quantity: 2 },
      { slug: "b", title: "B", price: 90, priceLabel: "₹90", quantity: 1 },
    ], 50);

    expect(totals.subtotal).toBe(210);
    expect(totals.itemCount).toBe(3);
    expect(totals.shipping).toBe(50);
    expect(totals.total).toBe(260);
  });
});

describe("product variants", () => {
  it("normalizes weights, prices, SKUs, and stock status", () => {
    const variants = normalizeSizeOptions({
      slug: "test-pepper",
      price: "₹100",
      sizeOptions: [{ label: "100g", price: "₹100", stock: 0 }],
      stock: 10,
    });

    expect(variants.map((variant) => variant.label)).toEqual(["100g", "250g", "500g", "1kg"]);
    expect(variants.map((variant) => variant.sku)).toEqual([
      "TEST-PEPPER-100G",
      "TEST-PEPPER-250G",
      "TEST-PEPPER-500G",
      "TEST-PEPPER-1KG",
    ]);
    expect(variants.map((variant) => variant.price)).toEqual(["₹100", "₹250", "₹500", "₹1000"]);
    expect(variants[0].stock).toBe(0);
    expect(variants[1].stock).toBe(10);
  });
});
