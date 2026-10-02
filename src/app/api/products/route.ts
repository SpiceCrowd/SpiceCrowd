import { NextResponse } from 'next/server';
import { readJson } from '@/lib/storage';
import { getProducts as fallbackProducts, getProduct as fallbackProduct, inferProductCategory, matchesProductQuery, normalizeSizeOptions, type Product } from '@/lib/products';
import { getCachedCatalog } from '@/lib/catalogCache';

type ProductQueryItem = Product & {
  category?: string;
  id?: string;
  variants?: Array<string | { label?: string }>;
};

function matchesQuery(product: ProductQueryItem, query: { category: string | null; origin: string | null; q: string | null; variant: string | null }) {
  return matchesProductQuery(product as Product, query);
}

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import('@/lib/db');
    return db.prisma;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const category = url.searchParams.get('category');
    const origin = url.searchParams.get('origin');
    const q = url.searchParams.get('q');
    const variant = url.searchParams.get('variant');
    const prisma = await getPrismaClient();
    const storedProducts = await readJson<ProductQueryItem[]>('products.json', fallbackProducts());
    const fallbackCatalog = storedProducts.length > 0 ? storedProducts : fallbackProducts();
    let catalog = fallbackCatalog;

    if (prisma) {
      try {
        const dbProducts = await getCachedCatalog(async () => {
          const dbProductsRaw = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
          const fallbackBySlug = new Map(fallbackCatalog.map((product) => [product.slug, product]));
          return dbProductsRaw.map((product) => {
            const base = fallbackBySlug.get(product.slug);
            const price = `₹${product.price}`;
            return {
              ...base,
              ...product,
              description: base?.description || product.shortDesc || '',
              location: base?.location || '',
              price,
              tag: base?.tag || '',
              rating: base?.rating || 0,
              reviews: base?.reviews || 0,
              origin: base?.origin || '',
              category: base?.category || inferProductCategory({ title: product.title, slug: product.slug, description: product.shortDesc || '' }),
              flavor: base?.flavor || '',
              heatLevel: base?.heatLevel || '',
              pairWith: base?.pairWith || [],
              bundlePrice: base?.bundlePrice || '',
              bundleSave: base?.bundleSave || '',
              bundleItems: base?.bundleItems || [],
              sizeOptions: normalizeSizeOptions({ slug: product.slug, price, sizeOptions: base?.sizeOptions || [], stock: product.stock ?? 10 }),
              usage: base?.usage || '',
              frequentlyBought: base?.frequentlyBought || [],
            };
          });
        }) as ProductQueryItem[];

        if (dbProducts.length > 0) {
          const dbBySlug = new Map(dbProducts.map((product) => [product.slug, product]));
          const catalogSlugs = new Set(fallbackCatalog.map((product) => product.slug));
          catalog = [
            ...fallbackCatalog.map((product) => dbBySlug.get(product.slug) || product),
            ...dbProducts.filter((product) => !catalogSlugs.has(product.slug)),
          ];
        }
      } catch {
        catalog = fallbackCatalog;
      }
    }

    const list = catalog.map((product) => ({
      ...product,
      stock: typeof product.stock === 'number' ? product.stock : 10,
    }));
    if (slug) {
      const p = list.find((product) => product.slug === slug) || fallbackProduct(slug);
      return NextResponse.json({ success: true, product: p });
    }

    const filtered = list.filter((product) => matchesQuery(product, { category, origin, q, variant }));

    return NextResponse.json({ success: true, products: filtered });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
