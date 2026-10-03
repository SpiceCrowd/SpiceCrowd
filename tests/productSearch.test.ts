import { getProducts } from "@/lib/products";
import { matchCategories, normalizeText, sanitizeQuery, searchCatalog, type SearchableProduct } from "@/lib/productSearch";

const catalog = getProducts() as SearchableProduct[];
const run = (q: string, extra = {}) => searchCatalog(catalog, { q, pageSize: 48, ...extra });
const slugs = (q: string, extra = {}) => run(q, extra).items.map((item) => item.slug);

describe("product search", () => {
  it("matches full and partial product names", () => {
    expect(slugs("kolli hills turmeric")[0]).toBe("kolli-hills-turmeric");
    expect(slugs("turm")).toContain("kolli-hills-turmeric");
    expect(slugs("PEPPER")).toEqual(expect.arrayContaining(["kolli-hills-black-pepper", "malabar-black-pepper"]));
    expect(slugs("peppers")).toContain("malabar-black-pepper");
  });

  it("ranks the exact title first", () => {
    expect(slugs("honey")[0]).toBe("kolli-hills-honey");
    expect(slugs("mustard seeds")[0]).toBe("mustard-seeds");
  });

  it("finds products by SKU, full or partial, in any separator style", () => {
    expect(slugs("KOLLI-HILLS-TURMERIC-100G")[0]).toBe("kolli-hills-turmeric");
    expect(slugs("kolli hills turmeric 100g")[0]).toBe("kolli-hills-turmeric");
    expect(slugs("honey-250g")).toContain("kolli-hills-honey");
  });

  it("finds products by category, origin and spice keywords", () => {
    expect(slugs("powders")).toEqual(expect.arrayContaining(["kolli-hills-turmeric-powder", "kolli-hills-black-pepper-powder"]));
    expect(slugs("sri lanka")).toEqual(["ceylon-cinnamon"]);
    expect(slugs("coffee")).toContain("kolli-hill-coffee-powder");
    expect(slugs("hot")).toContain("kanthari-chilli-green-dried");
  });

  it("does not list products that merely mention the term in pairings or prose", () => {
    expect(slugs("turmeric").sort()).toEqual(["kolli-hills-turmeric", "kolli-hills-turmeric-powder"]);
  });

  it("returns nothing for input with no searchable characters", () => {
    expect(run("(((").total).toBe(0);
    expect(run("!!!").total).toBe(0);
  });

  it("corrects a misspelling and reports it", () => {
    const result = run("tumeric");
    expect(result.correctedFrom).toBe("tumeric");
    expect(result.correctedTo).toBe("turmeric");
    expect(result.items.map((i) => i.slug)).toContain("kolli-hills-turmeric");
  });

  it("returns no results for nonsense without throwing", () => {
    const result = run("zzzqqq");
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1);
  });

  it("treats empty and whitespace queries as the full catalogue", () => {
    expect(run("").total).toBe(catalog.length);
    expect(run("   ").total).toBe(catalog.length);
  });

  it("is safe with special characters and very long input", () => {
    for (const q of ["(((", "[a-z]+", "<script>alert(1)</script>", "100%", "a\\b", "' OR 1=1 --", "₹99", "🌶️", "\u0000bad"]) {
      expect(() => run(q)).not.toThrow();
    }
    expect(run("<script>alert(1)</script>").total).toBe(0);
    expect(sanitizeQuery("x".repeat(500)).length).toBe(80);
    expect(normalizeText("Café—Ñ!")).toBe("cafe n");
  });

  it("paginates without overlap and clamps out-of-range pages", () => {
    const first = searchCatalog(catalog, { pageSize: 10, page: 1 });
    const second = searchCatalog(catalog, { pageSize: 10, page: 2 });
    const last = searchCatalog(catalog, { pageSize: 10, page: 999 });
    expect(first.items).toHaveLength(10);
    expect(first.totalPages).toBe(Math.ceil(catalog.length / 10));
    expect(first.items.some((a) => second.items.some((b) => a.slug === b.slug))).toBe(false);
    expect(last.page).toBe(last.totalPages);
    expect(searchCatalog(catalog, { pageSize: 9999 }).pageSize).toBe(48);
  });

  it("filters by category, price and stock, and sorts", () => {
    expect(run("", { category: "Powders" }).items.every((i) => i.category === "Powders")).toBe(true);
    expect(run("", { maxPrice: 50 }).items.every((i) => i.priceValue <= 50)).toBe(true);
    const asc = run("", { sort: "price-low" }).items.map((i) => i.priceValue);
    expect([...asc].sort((a, b) => a - b)).toEqual(asc);
  });

  it("reflects stock: unavailable products rank last and can be filtered out", () => {
    const stocked = catalog.map((p) => (p.slug === "kolli-hills-turmeric" ? { ...p, stock: 0 } : p));
    const result = searchCatalog(stocked, { q: "turmeric", pageSize: 48 });
    expect(result.items[0].inStock).toBe(true);
    expect(result.items.find((i) => i.slug === "kolli-hills-turmeric")?.inStock).toBe(false);
    expect(searchCatalog(stocked, { q: "turmeric", inStock: true }).items.map((i) => i.slug)).not.toContain("kolli-hills-turmeric");
  });

  it("matches category names for suggestions", () => {
    expect(matchCategories(catalog, "pow").map((c) => c.name)).toContain("Powders");
    expect(matchCategories(catalog, "zzz")).toEqual([]);
  });
});
