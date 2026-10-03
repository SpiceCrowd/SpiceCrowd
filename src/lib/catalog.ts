import { readJson } from "@/lib/storage";
import { getProducts as fallbackProducts, inferProductCategory, normalizeSizeOptions } from "@/lib/products";
import { getCachedCatalog } from "@/lib/catalogCache";
import type { SearchableProduct } from "@/lib/productSearch";

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import("@/lib/db");
    return db.prisma;
  } catch {
    return null;
  }
}

// Static catalogue merged with stored overrides and live database rows, so stock is always current.
export async function loadCatalog(): Promise<SearchableProduct[]> {
  const stored = await readJson<SearchableProduct[]>("products.json", fallbackProducts());
  const base = stored.length > 0 ? stored : fallbackProducts();
  let catalog = base;

  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      const dbProducts = (await getCachedCatalog(async () => {
        const rows = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
        const bySlug = new Map(base.map((product) => [product.slug, product]));
        return rows.map((row) => {
          const known = bySlug.get(row.slug);
          const price = `₹${row.price}`;
          return {
            ...known,
            ...row,
            description: known?.description || row.shortDesc || "",
            location: known?.location || "",
            price,
            tag: known?.tag || "",
            rating: known?.rating || 0,
            reviews: known?.reviews || 0,
            origin: known?.origin || "",
            category: known?.category || inferProductCategory({ title: row.title, slug: row.slug, description: row.shortDesc || "" }),
            flavor: known?.flavor || "",
            heatLevel: known?.heatLevel || "",
            pairWith: known?.pairWith || [],
            bundlePrice: known?.bundlePrice || "",
            bundleSave: known?.bundleSave || "",
            bundleItems: known?.bundleItems || [],
            sizeOptions: normalizeSizeOptions({ slug: row.slug, price, sizeOptions: known?.sizeOptions || [], stock: row.stock ?? 10 }),
            usage: known?.usage || "",
            frequentlyBought: known?.frequentlyBought || [],
          };
        });
      })) as SearchableProduct[];

      if (dbProducts.length > 0) {
        const dbBySlug = new Map(dbProducts.map((product) => [product.slug, product]));
        const knownSlugs = new Set(base.map((product) => product.slug));
        catalog = [...base.map((product) => dbBySlug.get(product.slug) || product), ...dbProducts.filter((product) => !knownSlugs.has(product.slug))];
      }
    } catch {
      catalog = base;
    }
  }

  return catalog.map((product) => ({
    ...product,
    category: product.category || inferProductCategory(product),
    stock: typeof product.stock === "number" ? product.stock : 10,
  }));
}
