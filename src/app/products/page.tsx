import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import ProductCard from "@/components/products/ProductCard";
import SearchBox from "@/components/products/SearchBox";
import CatalogToolbar from "@/components/products/CatalogToolbar";
import PromoStrip from "@/components/pricing/PromoStrip";
import { loadCatalog } from "@/lib/catalog";
import { parseSearchParams, searchCatalog, type SearchResult, type SearchableProduct } from "@/lib/productSearch";

// Stock changes with every order, so this page is rendered per request.
export const dynamic = "force-dynamic";

type RawParams = Promise<Record<string, string | string[] | undefined>>;

const FILTER_KEYS = ["q", "category", "origin", "sort", "inStock", "maxPrice"] as const;

function href(params: Record<string, string>, changes: Record<string, string | null> = {}) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return `/products${next.toString() ? `?${next}` : ""}`;
}

function pageWindow(page: number, total: number) {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

function NoResults({ q, params, catalog }: { q: string; params: Record<string, string>; catalog: SearchableProduct[] }) {
  const categories = new Map<string, number>();
  catalog.forEach((product) => categories.set(product.category || "", (categories.get(product.category || "") ?? 0) + 1));
  const suggestions = catalog.filter((product) => (product.stock ?? 10) > 0).slice(0, 4);
  const hasFilters = Boolean(params.category || params.origin || params.inStock || params.maxPrice);
  return (
    <div className="mt-8 rounded-2xl border border-[color:var(--brand-line)] bg-white p-6 sm:p-10">
      <h2 className="text-2xl font-bold text-slate-900">{q ? <>No products found for &ldquo;{q}&rdquo;</> : "No products match these filters"}</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
        <li>Check the spelling, or try a shorter word such as &ldquo;pepper&rdquo;.</li>
        <li>Search by product name, SKU, category or type, for example &ldquo;powder&rdquo;.</li>
        {hasFilters && <li>Your filters may be too narrow.</li>}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        {hasFilters && <Link href={href(params, { category: null, origin: null, inStock: null, maxPrice: null })} className="brand-btn">Clear filters</Link>}
        <Link href="/products" className={hasFilters ? "brand-btn-outline" : "brand-btn"}>Browse all products</Link>
      </div>
      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Browse by category</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {[...categories.entries()].filter(([name]) => name).map(([name, count]) => (
          <Link key={name} href={`/products?category=${encodeURIComponent(name)}`} className="rounded-full border border-[color:var(--brand-line)] px-4 py-1.5 text-sm text-slate-700 hover:border-[color:var(--brand-gold)]">{name} ({count})</Link>
        ))}
      </div>
      {suggestions.length > 0 && (
        <>
          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Products to start with</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: RawParams }) {
  const raw = await searchParams;
  const first = (key: string) => (Array.isArray(raw[key]) ? raw[key]![0] : (raw[key] as string | undefined)) ?? null;
  const params: Record<string, string> = {};
  for (const key of FILTER_KEYS) {
    const value = first(key)?.trim();
    if (value) params[key] = value.slice(0, 80);
  }

  let catalog: SearchableProduct[] = [];
  let result: SearchResult | null = null;
  try {
    catalog = await loadCatalog();
    result = searchCatalog(catalog, parseSearchParams((key) => (key === "page" ? first("page") : params[key] ?? null)));
  } catch {
    result = null;
  }

  const q = params.q ?? "";
  const category = params.category;
  const heading = q ? `Results for “${q}”` : category ? category : params.origin ? params.origin : "Browse our full catalog";
  const from = result && result.total ? (result.page - 1) * result.pageSize + 1 : 0;
  const to = result ? Math.min(result.total, result.page * result.pageSize) : 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{heading}</h1>
          <div className="mt-6 text-left"><SearchBox key={q} variant="page" initialValue={q} /></div>
          <PromoStrip className="mt-3" />
        </div>

        {!result ? (
          <div role="alert" className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-900">We couldn&apos;t load the catalogue right now.</p>
            <p className="mt-1 text-sm text-red-800">This is a temporary problem on our side. Please try again in a moment.</p>
            <Link href={href(params)} className="brand-btn mt-4">Try again</Link>
          </div>
        ) : (
          <>
            {result.facets.categories.length > 0 && (
              <nav aria-label="Product categories" className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
                <Link href={href(params, { category: null })} aria-current={!category ? "page" : undefined} className={`rounded-full border px-4 py-1.5 ${!category ? "border-[color:var(--brand-deep-green)] bg-[color:var(--brand-deep-green)] text-white" : "border-[color:var(--brand-line)] bg-white text-slate-700 hover:border-[color:var(--brand-gold)]"}`}>All</Link>
                {result.facets.categories.map((facet) => (
                  <Link key={facet.name} href={href(params, { category: facet.name })} aria-current={category === facet.name ? "page" : undefined} className={`rounded-full border px-4 py-1.5 ${category === facet.name ? "border-[color:var(--brand-deep-green)] bg-[color:var(--brand-deep-green)] text-white" : "border-[color:var(--brand-line)] bg-white text-slate-700 hover:border-[color:var(--brand-gold)]"}`}>{facet.name} ({facet.count})</Link>
                ))}
              </nav>
            )}

            <div className="mt-8 flex flex-col gap-3 border-y border-[color:var(--brand-line)] py-4 sm:flex-row sm:items-center sm:justify-between">
              <p role="status" aria-live="polite" className="text-sm text-slate-600">
                {result.total ? `Showing ${from}-${to} of ${result.total} ${result.total === 1 ? "product" : "products"}` : "No products found"}
              </p>
              <CatalogToolbar sort={result.sort} inStock={params.inStock === "1"} maxPrice={Number(params.maxPrice) || null} params={params} />
            </div>

            {result.correctedFrom && result.correctedTo && (
              <p className="mt-4 rounded-xl bg-[color:var(--brand-cream)] px-4 py-3 text-sm text-slate-700">
                No exact matches for &ldquo;{result.correctedFrom}&rdquo;. Showing results for <Link href={href(params, { q: result.correctedTo })} className="font-semibold underline">{result.correctedTo}</Link> instead.
              </p>
            )}

            {result.total === 0 ? (
              <NoResults q={q} params={params} catalog={catalog} />
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {result.items.map((product) => <ProductCard key={product.slug} product={product} />)}
                </div>
                {result.totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
                    {result.page > 1 && <Link rel="prev" href={href(params, { page: String(result.page - 1) })} className="brand-btn-outline">← Previous</Link>}
                    {pageWindow(result.page, result.totalPages).map((p, i, all) => (
                      <span key={p} className="flex items-center gap-2">
                        {i > 0 && p - all[i - 1] > 1 && <span aria-hidden="true">…</span>}
                        <Link href={href(params, { page: p === 1 ? null : String(p) })} aria-current={p === result.page ? "page" : undefined} aria-label={`Page ${p}`} className={`rounded-lg border px-3 py-1.5 ${p === result.page ? "border-[color:var(--brand-deep-green)] bg-[color:var(--brand-deep-green)] text-white" : "border-[color:var(--brand-line)] bg-white hover:border-[color:var(--brand-gold)]"}`}>{p}</Link>
                      </span>
                    ))}
                    {result.page < result.totalPages && <Link rel="next" href={href(params, { page: String(result.page + 1) })} className="brand-btn-outline">Next →</Link>}
                  </nav>
                )}
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
