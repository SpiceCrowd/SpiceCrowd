import { parsePrice } from "@/lib/cart";
import { getProduct, getProducts, inferProductCategory } from "@/lib/products";
import { readJson } from "@/lib/storage";

const KOLLI_HILLS = "Kolli Hills, Tamil Nadu";

const bestSellerFallback = ["kolli-hills-turmeric", "kolli-hills-black-pepper", "kolli-hills-cinnamon", "kolli-hills-home-masala-mix"];
const specialtySlugs = ["kolli-hills-kalpasi", "kolli-hills-honey", "kolli-hill-coffee-powder", "malabar-black-pepper"];
const usageSlugs = ["kolli-hills-tamarind", "mustard-seeds", "kolli-hill-coffee-powder"];

export const comboDefinitions = [
  { id: "everyday-basics", title: "Everyday Curry Basics", note: "The three powders most daily cooking starts with.", slugs: ["kolli-hills-turmeric-powder", "kolli-hills-black-pepper-powder", "kolli-hills-home-masala-mix"] },
  { id: "whole-spice-starter", title: "Whole Spice Starter", note: "Whole spices for gravies, rice dishes and tea.", slugs: ["kolli-hills-black-pepper", "kolli-hills-cinnamon", "kolli-hills-cloves"] },
  { id: "warm-and-aromatic", title: "Warm & Aromatic", note: "For desserts, baking and slow-cooked dishes.", slugs: ["kolli-hills-cinnamon", "kolli-hills-nutmeg", "kolli-hills-cloves"] },
  { id: "coffee-and-honey", title: "Coffee & Honey", note: "A Kolli Hills morning, in two packs.", slugs: ["kolli-hill-coffee-powder", "kolli-hills-honey"] },
];

type CatalogProduct = NonNullable<ReturnType<typeof getProduct>>;

function pick(slugs: string[]): CatalogProduct[] {
  return slugs.map((slug) => getProduct(slug)).filter((product): product is CatalogProduct => Boolean(product));
}

type StoredOrder = { status?: string; items?: Array<{ slug?: string; quantity?: number }> };

// Best sellers come from real paid orders; with too little order history we show editorial picks and say so.
export async function getBestSellers(limit = 4): Promise<{ products: CatalogProduct[]; fromOrders: boolean }> {
  try {
    const orders = await readJson<StoredOrder[]>("orders.json", []);
    const sold = new Map<string, number>();
    for (const order of Array.isArray(orders) ? orders : []) {
      if (!order.status || ["payment_pending", "cancelled", "failed"].includes(order.status)) continue;
      for (const item of order.items ?? []) {
        if (item.slug && getProduct(item.slug)) sold.set(item.slug, (sold.get(item.slug) ?? 0) + (Number(item.quantity) || 1));
      }
    }
    const ranked = [...sold.entries()].sort((a, b) => b[1] - a[1]).map(([slug]) => slug);
    if (ranked.length >= limit) return { products: pick(ranked.slice(0, limit)), fromOrders: true };
  } catch {
    // Fall through to editorial picks.
  }
  return { products: pick(bestSellerFallback).slice(0, limit), fromOrders: false };
}

// Only products with real artwork in /public/images, so the first screen never shows a placeholder.
export function getHeroProducts() {
  return pick(["kolli-hills-turmeric", "kolli-hills-black-pepper"]);
}

export function getSpecialtyProducts() {
  return pick(specialtySlugs);
}

export function getUsageProducts() {
  return pick(usageSlugs);
}

export function getCombos() {
  return comboDefinitions.map((combo) => {
    const items = pick(combo.slugs);
    return { ...combo, items, total: items.reduce((sum, item) => sum + parsePrice(item.price), 0) };
  });
}

export function getCategorySummaries() {
  const groups = new Map<string, CatalogProduct[]>();
  for (const product of getProducts()) {
    const name = product.category || inferProductCategory(product);
    groups.set(name, [...(groups.get(name) ?? []), product]);
  }
  return [...groups.entries()]
    .map(([name, items]) => ({
      name,
      count: items.length,
      fromPrice: Math.min(...items.map((item) => parsePrice(item.price))),
      href: `/products?category=${encodeURIComponent(name)}`,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getCatalogFacts() {
  const products = getProducts();
  return {
    count: products.length,
    fromPrice: Math.min(...products.map((product) => parsePrice(product.price))),
    kolliHillsCount: products.filter((product) => (product.origin || product.location) === KOLLI_HILLS).length,
    kolliHillsHref: `/products?origin=${encodeURIComponent(KOLLI_HILLS)}`,
  };
}
