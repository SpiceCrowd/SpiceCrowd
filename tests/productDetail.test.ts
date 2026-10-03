import { getProducts } from "@/lib/products";
import { companionProducts, mrpInfo, neighbours, pickInitialSize, productBadges, relatedProducts, splitUsage, stockMessage, stockOf } from "@/lib/productDetail";
import type { SearchableProduct } from "@/lib/productSearch";

const catalog = getProducts() as SearchableProduct[];
const turmeric = catalog.find((p) => p.slug === "kolli-hills-turmeric")!;

describe("splitUsage", () => {
  it("separates storage advice from usage advice", () => {
    const { storage, use } = splitUsage("Keep in an airtight container. Use within 2 years for best potency. Add to curries, teas, and marinades.");
    expect(storage).toEqual(["Keep in an airtight container."]);
    expect(use).toEqual(["Use within 2 years for best potency.", "Add to curries, teas, and marinades."]);
  });
  it("handles empty text", () => {
    expect(splitUsage(undefined)).toEqual({ storage: [], use: [] });
  });
});

describe("variant selection and stock", () => {
  const sizes = [{ label: "100g", price: "₹89", stock: 0 }, { label: "250g", price: "₹223", stock: 4 }, { label: "500g", price: "₹349", stock: 10 }];
  it("prefers the requested size, else the first in-stock size", () => {
    expect(pickInitialSize(sizes, { stock: 10 }, "500G")?.label).toBe("500g");
    expect(pickInitialSize(sizes, { stock: 10 }, "9kg")?.label).toBe("250g");
    expect(pickInitialSize(sizes, { stock: 10 })?.label).toBe("250g");
  });
  it("falls back to the first size when everything is out of stock", () => {
    expect(pickInitialSize(sizes.map((s) => ({ ...s, stock: 0 })), { stock: 10 })?.label).toBe("100g");
  });
  it("never reports negative stock and describes low stock", () => {
    expect(stockOf({ stock: -3 }, { stock: 10 })).toBe(0);
    expect(stockMessage(0).tone).toBe("out");
    expect(stockMessage(3)).toEqual({ tone: "low", text: "Only 3 left" });
    expect(stockMessage(6).tone).toBe("in");
  });
});

describe("MRP and savings", () => {
  it("shows no savings without a genuine higher MRP", () => {
    expect(mrpInfo({ price: "₹89", mrp: undefined }, { label: "100g", price: "₹89" })).toBeNull();
    expect(mrpInfo({ price: "₹89", mrp: 89 }, { label: "100g", price: "₹89" })).toBeNull();
    expect(mrpInfo({ price: "₹89", mrp: 70 }, { label: "100g", price: "₹89" })).toBeNull();
  });
  it("calculates savings only for the size the MRP belongs to", () => {
    expect(mrpInfo({ price: "₹89", mrp: 100 }, { label: "100g", price: "₹89" })).toEqual({ mrp: 100, savings: 11, percent: 11 });
    expect(mrpInfo({ price: "₹89", mrp: 100 }, { label: "250g", price: "₹223" })).toBeNull();
  });
});

describe("related content uses real products", () => {
  it("maps frequently-bought names to in-stock catalogue products, never itself", () => {
    const companions = companionProducts(catalog, turmeric);
    expect(companions.length).toBeGreaterThan(0);
    expect(companions.every((p) => p.slug !== turmeric.slug && catalog.some((c) => c.slug === p.slug))).toBe(true);
    expect(companions[0].title).toBe("Kolli Hills Black Pepper");
  });
  it("skips out-of-stock companions", () => {
    const stocked = catalog.map((p) => (p.slug === "kolli-hills-black-pepper" ? { ...p, stock: 0 } : p));
    expect(companionProducts(stocked, turmeric).some((p) => p.slug === "kolli-hills-black-pepper")).toBe(false);
  });
  it("suggests related products from the same category or origin without duplicates", () => {
    const related = relatedProducts(catalog, turmeric, 4);
    expect(related).toHaveLength(4);
    expect(new Set(related.map((p) => p.slug)).size).toBe(4);
    expect(related.some((p) => p.slug === turmeric.slug)).toBe(false);
  });
  it("finds neighbours within the category", () => {
    const { previous, next } = neighbours(catalog, turmeric);
    expect(previous).toBeNull();
    expect(next?.category).toBe(turmeric.category);
  });
});

describe("badges", () => {
  it("hides the unverified static Best Seller tag but keeps genuine flags", () => {
    expect(productBadges(turmeric)).toEqual([]);
    expect(productBadges({ ...turmeric, isBestseller: true })).toEqual(["Best Seller"]);
    expect(productBadges(catalog.find((p) => p.slug === "kolli-hills-kalpasi")!)).toEqual(["Rare"]);
  });
});
