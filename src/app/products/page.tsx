import Link from "next/link";
import { getProducts, matchesProductQuery } from "@/lib/products";
import { getCategorySummaries } from "@/lib/homeData";
import ProductCatalog from "@/components/products/ProductCatalog";
import PromoStrip from "@/components/pricing/PromoStrip";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || null;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = { category: first(params.category), origin: first(params.origin), q: first(params.q), variant: null };
  const all = getProducts();
  const products = all.filter((product) => matchesProductQuery(product, query));
  const filtered = Boolean(query.category || query.origin || query.q);
  const label = [query.category, query.origin, query.q && `"${query.q}"`].filter(Boolean).join(" · ");
  const categories = getCategorySummaries();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[color:var(--brand-deep-green)]">{filtered ? "Filtered" : "All Spices"}</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">{filtered ? label : "Browse our full catalog"}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Explore our range of hill-grown spices, each handpicked for freshness, flavor, and purity.
          </p>
          <PromoStrip className="mt-3" />
        </div>
        <nav aria-label="Product categories" className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
          <Link href="/products" aria-current={!filtered ? "page" : undefined} className={`rounded-full border px-4 py-1.5 ${!filtered ? "border-[color:var(--brand-deep-green)] bg-[color:var(--brand-deep-green)] text-white" : "border-[color:var(--brand-line)] bg-white text-slate-700 hover:border-[color:var(--brand-gold)]"}`}>All ({all.length})</Link>
          {categories.map((category) => (
            <Link key={category.name} href={category.href} aria-current={query.category === category.name ? "page" : undefined} className={`rounded-full border px-4 py-1.5 ${query.category === category.name ? "border-[color:var(--brand-deep-green)] bg-[color:var(--brand-deep-green)] text-white" : "border-[color:var(--brand-line)] bg-white text-slate-700 hover:border-[color:var(--brand-gold)]"}`}>{category.name} ({category.count})</Link>
          ))}
        </nav>
        {products.length === 0 ? (
          <div className="empty-state mt-10">
            <p className="empty-state-title">No products match this filter</p>
            <Link href="/products" className="brand-btn mt-4">View all products</Link>
          </div>
        ) : (
          <ProductCatalog products={products} />
        )}
      </main>
      <Footer />
    </>
  );
}
