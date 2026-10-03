import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import ProductCard from "@/components/products/ProductCard";
import SearchBox from "@/components/products/SearchBox";
import CatalogFilters from "@/components/products/CatalogFilters";
import PromoStrip from "@/components/pricing/PromoStrip";
import { loadCatalog } from "@/lib/catalog";
import { getOfferSlugs } from "@/lib/catalogOffers";
import { activeChips, buildCatalogUrl, readFilterState, resetState, type FilterState } from "@/lib/catalogUrl";
import { searchCatalog, type SearchParams, type SearchResult, type SearchableProduct } from "@/lib/productSearch";

// Stock changes with every order, so this page is rendered per request.
export const dynamic = "force-dynamic";

type RawParams = Promise<Record<string, string | string[] | undefined>>;

function pageWindow(page: number, total: number) {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

function toSearchParams(state: FilterState, page: number, offerSlugs: Set<string> | null): SearchParams {
  return {
    q: state.q,
    categories: state.category,
    origins: state.origin,
    heat: state.heat,
    sort: state.sort,
    inStock: state.inStock,
    onOffer: state.offer,
    offerSlugs,
    minPrice: Number(state.minPrice) || null,
    maxPrice: Number(state.maxPrice) || null,
    page,
  };
}

function NoResults({ state, catalog, relaxations }: { state: FilterState; catalog: SearchableProduct[]; relaxations: Array<{ id: string; label: string; total: number; next: FilterState }> }) {
  const categories = new Map<string, number>();
  catalog.forEach((product) => categories.set(product.category || "", (categories.get(product.category || "") ?? 0) + 1));
  const suggestions = catalog.filter((product) => (product.stock ?? 10) > 0).slice(0, 4);
  const hasFilters = relaxations.length > 0;
  return (
    <div className="rounded-2xl border border-[color:var(--brand-line)] bg-white p-6 sm:p-10">
      <h2 className="text-2xl font-bold text-slate-900">{state.q ? <>No products found for &ldquo;{state.q}&rdquo;</> : "No products match these filters"}</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {state.q && <li>Check the spelling, or try a shorter word such as &ldquo;pepper&rdquo;.</li>}
        {hasFilters && <li>Your filters may be too narrow. Remove one to see more products.</li>}
        {!hasFilters && <li>Search by product name, SKU, category or type, for example &ldquo;powder&rdquo;.</li>}
      </ul>
      {hasFilters && (
        <div className="mt-5 flex flex-wrap gap-2">
          {relaxations.filter((r) => r.total > 0).map((r) => (
            <Link key={r.id} href={buildCatalogUrl(r.next)} className="rounded-full border border-[color:var(--brand-gold)] bg-[color:var(--brand-cream)] px-4 py-1.5 text-sm text-slate-800 hover:bg-white">
              Remove &ldquo;{r.label}&rdquo; to see {r.total} {r.total === 1 ? "product" : "products"}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {hasFilters && <Link href={buildCatalogUrl(resetState(state))} className="brand-btn">Reset filters</Link>}
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
  const get = (key: string) => (Array.isArray(raw[key]) ? raw[key]![0] : (raw[key] as string | undefined)) ?? null;
  const getAll = (key: string) => (Array.isArray(raw[key]) ? raw[key]! : raw[key] ? [raw[key] as string] : []);
  const state = readFilterState(get, getAll);
  const requestedPage = Number(get("page")) > 0 ? Math.floor(Number(get("page"))) : 1;

  let catalog: SearchableProduct[] = [];
  let result: SearchResult | null = null;
  let relaxations: Array<{ id: string; label: string; total: number; next: FilterState }> = [];
  try {
    catalog = await loadCatalog();
    const offerSlugs = await getOfferSlugs(catalog);
    result = searchCatalog(catalog, toSearchParams(state, requestedPage, offerSlugs));
    if (result.total === 0) {
      relaxations = activeChips(state).map((chip) => ({ id: chip.id, label: chip.label, next: chip.next, total: searchCatalog(catalog, toSearchParams(chip.next, 1, offerSlugs)).total }));
    }
  } catch {
    result = null;
  }

  const chips = activeChips(state);
  const heading = state.q ? `Results for “${state.q}”` : state.category.length === 1 && chips.length === 1 ? state.category[0] : "Browse our full catalog";
  const from = result && result.total ? (result.page - 1) * result.pageSize + 1 : 0;
  const to = result ? Math.min(result.total, result.page * result.pageSize) : 0;
  const sortOptions = result
    ? [
        { value: "relevance", label: state.q ? "Best match" : "Featured" },
        ...(result.facets.newestAvailable ? [{ value: "newest", label: "Newest" }] : []),
        { value: "price-low", label: "Price: low to high" },
        { value: "price-high", label: "Price: high to low" },
        { value: "name", label: "Name: A to Z" },
      ]
    : [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{heading}</h1>
          <div className="mt-6 text-left"><SearchBox key={state.q} variant="page" initialValue={state.q} /></div>
          <PromoStrip className="mt-3" />
        </div>

        {!result ? (
          <div role="alert" className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-900">We couldn&apos;t load the catalogue right now.</p>
            <p className="mt-1 text-sm text-red-800">This is a temporary problem on our side. Please try again in a moment.</p>
            <Link href={buildCatalogUrl(state, requestedPage)} className="brand-btn mt-4">Try again</Link>
          </div>
        ) : (
          <div className="mt-8">
            <CatalogFilters
              state={state}
              facets={result.facets}
              sortOptions={sortOptions}
              sort={result.sort}
              total={result.total}
              summary={
                <p role="status" aria-live="polite" className="text-sm text-slate-600">
                  {result.total ? `Showing ${from}-${to} of ${result.total} ${result.total === 1 ? "product" : "products"}` : "0 products"}
                </p>
              }
              chips={
                chips.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
                    {chips.map((chip) => (
                      <Link key={chip.id} href={buildCatalogUrl(chip.next)} aria-label={`Remove filter ${chip.label}`} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-deep-green)]/30 bg-[color:var(--brand-cream)] px-3 py-1 text-sm text-slate-800 hover:bg-white">
                        {chip.label}
                        <span aria-hidden="true" className="text-base leading-none">×</span>
                      </Link>
                    ))}
                    <Link href={buildCatalogUrl(resetState(state))} className="ml-1 text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">Reset filters</Link>
                  </div>
                ) : null
              }
            >
              {result.correctedFrom && result.correctedTo && (
                <p className="mb-4 rounded-xl bg-[color:var(--brand-cream)] px-4 py-3 text-sm text-slate-700">
                  No exact matches for &ldquo;{result.correctedFrom}&rdquo;. Showing results for <Link href={buildCatalogUrl({ ...state, q: result.correctedTo })} className="font-semibold underline">{result.correctedTo}</Link> instead.
                </p>
              )}
              {result.total === 0 ? (
                <NoResults state={state} catalog={catalog} relaxations={relaxations} />
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {result.items.map((product) => <ProductCard key={product.slug} product={product} />)}
                  </div>
                  {result.totalPages > 1 && (
                    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
                      {result.page > 1 && <Link rel="prev" href={buildCatalogUrl(state, result.page - 1)} className="brand-btn-outline">← Previous</Link>}
                      {pageWindow(result.page, result.totalPages).map((p, i, all) => (
                        <span key={p} className="flex items-center gap-2">
                          {i > 0 && p - all[i - 1] > 1 && <span aria-hidden="true">…</span>}
                          <Link href={buildCatalogUrl(state, p)} aria-current={p === result.page ? "page" : undefined} aria-label={`Page ${p}`} className={`rounded-lg border px-3 py-1.5 ${p === result.page ? "border-[color:var(--brand-deep-green)] bg-[color:var(--brand-deep-green)] text-white" : "border-[color:var(--brand-line)] bg-white hover:border-[color:var(--brand-gold)]"}`}>{p}</Link>
                        </span>
                      ))}
                      {result.page < result.totalPages && <Link rel="next" href={buildCatalogUrl(state, result.page + 1)} className="brand-btn-outline">Next →</Link>}
                    </nav>
                  )}
                </>
              )}
            </CatalogFilters>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
