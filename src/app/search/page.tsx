import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import type { Product } from "@/lib/products";

import SearchClient from "@/components/products/SearchClient";
import { site } from "@/config/site";

type SearchableProduct = Product & {
  category?: string;
};

async function fetchSearchResults(query: string): Promise<SearchableProduct[]> {
  if (!query) {
    return [];
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || site.website;
  const res = await fetch(`${base}/api/products?q=${encodeURIComponent(query)}`, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { products?: SearchableProduct[] };
  return data.products || [];
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string }> | { q?: string } }) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const initialQuery = resolvedSearchParams?.q || "";
  const initialResults = await fetchSearchResults(initialQuery);

  return (
    <>
      <Header />
      <main className="bg-[radial-gradient(circle_at_top_right,_color-mix(in_srgb,var(--brand-deep-green)_12%,white),_transparent_35%),linear-gradient(180deg,_#fff,_#f8fafc)] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="rounded-[1.8rem] border border-[color:var(--brand-deep-green)]/18 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-deep-green)]">Search</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Find Products Fast</h1>
            <p className="mt-2 text-sm text-slate-600">Search products by name, origin, or category.</p>
          </section>

          <div className="mt-6">
            <SearchClient initialQuery={initialQuery} initialResults={initialResults} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
