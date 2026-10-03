import { parsePrice } from "@/lib/cart";
import { normalizeText, type SearchableProduct } from "@/lib/productSearch";

export type SizeOption = { label: string; price: string; sku?: string; stock?: number };

const STORAGE_WORDS = /\b(store|stored|storage|keep|kept|airtight|sealed|jar|container|cool|dry place)\b/i;

// The catalogue keeps storage and usage advice in one sentence list; split it so each can be shown under its own heading.
export function splitUsage(usage: string | undefined) {
  const sentences = (usage || "").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return {
    storage: sentences.filter((s) => STORAGE_WORDS.test(s)),
    use: sentences.filter((s) => !STORAGE_WORDS.test(s)),
  };
}

export function stockOf(option: Pick<SizeOption, "stock"> | undefined, product: Pick<SearchableProduct, "stock">) {
  const stock = option?.stock ?? product.stock ?? 10;
  return Math.max(0, stock);
}

export function pickInitialSize(options: SizeOption[], product: Pick<SearchableProduct, "stock">, requested?: string | null) {
  const wanted = requested ? options.find((o) => o.label.toLowerCase() === requested.toLowerCase()) : undefined;
  if (wanted) return wanted;
  return options.find((o) => stockOf(o, product) > 0) ?? options[0];
}

// MRP is stored for the product's base price only, so savings are shown just for that size and only when it is genuinely higher.
export function mrpInfo(product: Pick<SearchableProduct, "mrp" | "price">, selected: SizeOption | undefined) {
  const mrp = Number(product.mrp);
  const base = parsePrice(product.price);
  if (!selected || !Number.isFinite(mrp) || mrp <= base || parsePrice(selected.price) !== base) return null;
  const savings = mrp - base;
  return { mrp, savings, percent: Math.round((savings / mrp) * 100) };
}

export function stockMessage(stock: number) {
  if (stock <= 0) return { tone: "out" as const, text: "Out of stock" };
  if (stock <= 5) return { tone: "low" as const, text: `Only ${stock} left` };
  return { tone: "in" as const, text: "In stock" };
}

// Maps the catalogue's "frequently bought" names onto real, in-stock products (the plain spice before its powder, then catalogue order).
export function companionProducts(catalog: SearchableProduct[], product: SearchableProduct, limit = 3) {
  const picked: SearchableProduct[] = [];
  for (const name of product.frequentlyBought || []) {
    const key = normalizeText(name);
    if (!key) continue;
    const match = catalog
      .filter((p) => p.slug !== product.slug && !picked.some((x) => x.slug === p.slug) && (p.stock ?? 10) > 0 && normalizeText(p.title).includes(key))
      .sort((a, b) => Number(/powder/i.test(a.title)) - Number(/powder/i.test(b.title)))[0];
    if (match) picked.push(match);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function relatedProducts(catalog: SearchableProduct[], product: SearchableProduct, limit = 4) {
  const companions = new Set(companionProducts(catalog, product).map((p) => p.slug));
  return catalog
    .filter((p) => p.slug !== product.slug && !companions.has(p.slug))
    .map((p) => ({ p, score: (p.category === product.category ? 2 : 0) + ((p.origin || p.location) === (product.origin || product.location) ? 1 : 0) + ((p.stock ?? 10) > 0 ? 0.5 : 0) }))
    .filter((row) => row.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.p);
}

export function neighbours(catalog: SearchableProduct[], product: SearchableProduct) {
  const siblings = catalog.filter((p) => p.category === product.category);
  const index = siblings.findIndex((p) => p.slug === product.slug);
  return { previous: index > 0 ? siblings[index - 1] : null, next: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null };
}

// "Best Seller" in the static data is not backed by sales, so it is shown only when the database flags it.
export function productBadges(product: SearchableProduct) {
  const badges: string[] = [];
  if (product.tag && product.tag.toLowerCase() !== "best seller") badges.push(product.tag);
  if (product.isBestseller) badges.push("Best Seller");
  if (product.isNewArrival) badges.push("New");
  if (product.isFeatured) badges.push("Featured");
  return [...new Set(badges)];
}
