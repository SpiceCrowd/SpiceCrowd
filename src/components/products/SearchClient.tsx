"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/lib/products";

type SearchableProduct = Product & {
  category?: string;
};

export default function SearchClient({ initialQuery = "", initialResults = [] }: { initialQuery?: string; initialResults?: SearchableProduct[] }) {
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState<SearchableProduct[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);

  const doSearch = async (term: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (term) qs.set("q", term);
      if (category) qs.set("category", category);
      if (origin) qs.set("origin", origin);
      const res = await fetch(`/api/products?${qs.toString()}`);
      const json = (await res.json()) as { products?: SearchableProduct[] };
      setResults(json.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch product list to derive categories/origins for filters
    const fetchOptions = async () => {
      try {
        const res = await fetch(`/api/products`);
        const json = (await res.json()) as { products?: SearchableProduct[] };
        const list = json.products || [];
        const cats = new Set<string>();
        const orgs = new Set<string>();
        list.forEach((p) => {
          const c = p.category || p.origin || p.location;
          if (c) cats.add(c);
          const o = p.origin || p.location;
          if (o) orgs.add(o);
        });
        setCategories(Array.from(cats).sort());
        setOrigins(Array.from(orgs).sort());
      } catch {
        setCategories([]);
        setOrigins([]);
      }
    };

    fetchOptions();
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(q);
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:flex-row">
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products, origins, or categories..."
          className="form-input"
        />

        <select
          value={category || ""}
          onChange={(e) => setCategory(e.target.value || null)}
          className="form-input"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={origin || ""}
          onChange={(e) => setOrigin(e.target.value || null)}
          className="form-input"
        >
          <option value="">All origins</option>
          {origins.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        <button type="submit" className="brand-btn">
          Search
        </button>
      </form>

      {loading && <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">Searching…</div>}

      {results.length === 0 && !loading ? (
        <div className="empty-state">
          <p className="empty-state-title">No products found</p>
          <p className="empty-state-copy">Try a different keyword, origin, or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
