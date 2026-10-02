import type { Product } from "@/lib/products";

type CachedCatalog = { expiresAt: number; products: Product[] };

let cached: CachedCatalog | null = null;
let inflight: Promise<Product[]> | null = null;
const ttlMs = 250;

export async function getCachedCatalog(loader: () => Promise<Product[]>) {
  if (cached && cached.expiresAt > Date.now()) return cached.products;
  if (inflight) return inflight;
  inflight = loader().then((products) => {
    cached = { products, expiresAt: Date.now() + ttlMs };
    return products;
  }).finally(() => {
    inflight = null;
  });
  return inflight;
}

export function invalidateCatalogCache() {
  cached = null;
}