import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/lib/products";

type ShopSearchParams = {
  category?: string;
  origin?: string;
  q?: string;
};

async function fetchProducts(query: string): Promise<Product[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/products${query}`);
  const data = (await res.json().catch(() => ({}))) as { products?: Product[] };
  return data.products || [];
}

export default async function ShopPage({ searchParams }: { searchParams?: Promise<ShopSearchParams> | ShopSearchParams }) {
  const qs = new URLSearchParams();
  const sp = searchParams instanceof Promise ? await searchParams : searchParams ?? {};
  if (sp.category) qs.set("category", sp.category);
  if (sp.origin) qs.set("origin", sp.origin);
  if (sp.q) qs.set("q", sp.q);

  const query = qs.toString() ? `?${qs.toString()}` : "";
  const products = await fetchProducts(query);

  return (
    <>
      <Header />
      <main className="bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,var(--brand-deep-green)_12%,white),_transparent_35%),linear-gradient(180deg,_#fff,_#f8fafc)] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="rounded-[1.8rem] border border-[color:var(--brand-deep-green)]/18 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-deep-green)]">Catalog</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Shop All Products</h1>
            <p className="mt-2 text-sm text-slate-600">Browse our collections and single-origin spices.</p>
          </section>

          {products.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No products match this filter right now.</div>
          ) : null}

          <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
