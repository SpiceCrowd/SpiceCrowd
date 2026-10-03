"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = { sort: string; inStock: boolean; maxPrice: number | null; params: Record<string, string> };

// Filter state lives in the URL so the back button and shared links restore it exactly.
export default function CatalogToolbar({ sort, inStock, maxPrice, params }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    startTransition(() => router.push(`/products${next.toString() ? `?${next}` : ""}`));
  }

  const select = "form-input min-w-36 py-2";
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600" aria-busy={pending}>
      <label className="flex items-center gap-2">
        <span>Sort</span>
        <select aria-label="Sort products" value={sort} onChange={(event) => update({ sort: event.target.value === "relevance" ? null : event.target.value })} className={select}>
          <option value="relevance">{params.q ? "Best match" : "Featured"}</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
          <option value="name">Name: A to Z</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <span>Up to</span>
        <select aria-label="Filter by maximum price" value={maxPrice ?? ""} onChange={(event) => update({ maxPrice: event.target.value || null })} className={select}>
          <option value="">Any price</option>
          {[50, 100, 150, 250].map((price) => <option key={price} value={price}>₹{price}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={inStock} onChange={(event) => update({ inStock: event.target.checked ? "1" : null })} className="h-4 w-4 accent-[color:var(--brand-deep-green)]" />
        <span>In stock only</span>
      </label>
      {pending && <span role="status" className="text-xs text-slate-500">Updating…</span>}
    </div>
  );
}
