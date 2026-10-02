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
    if (prisma) {
      const dbProducts = await getCachedCatalog(async () => {
        const dbProductsRaw = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
        return dbProductsRaw.map((product) => ({
        ...product,
        description: '',
        location: '',
        price: `₹${product.price}`,
        tag: '',
        rating: 0,
        reviews: 0,
        origin: '',
        category: inferProductCategory({
          title: product.title,
          slug: product.slug,
          description: '',
        }),
        flavor: '',
        heatLevel: '',
        pairWith: [],
        bundlePrice: '',
        bundleSave: '',
        bundleItems: [],
        sizeOptions: normalizeSizeOptions({ slug: product.slug, price: `₹${product.price}`, sizeOptions: [], stock: product.stock ?? 10 }),
        usage: '',
        frequentlyBought: [],
        }));
      }) as ProductQueryItem[];
      if (slug) {
        const storedProducts = await readJson<ProductQueryItem[]>("products.json", []);
        const stored = storedProducts.find((product) => product.slug === slug);
        const p = dbProducts.find((product) => product.slug === slug) || stored || {
          ...fallbackProduct(slug),
          stock: 10,
        };
        return NextResponse.json({ success: true, product: p });
      }

      const products = dbProducts.filter((product) =>
        matchesQuery(product, { category, origin, q, variant }),
      );
      return NextResponse.json({ success: true, products });
    }

    // fallback to storage files
    const list = (await readJson<ProductQueryItem[]>('products.json', fallbackProducts())).map((product) => ({
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
