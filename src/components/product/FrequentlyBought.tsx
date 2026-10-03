"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatCurrency, parsePrice } from "@/lib/cart";

export type BundleItem = { slug: string; title: string; price: string; sku?: string; sizeLabel: string; inStock: boolean };

// Items are real catalogue products at their listed prices (default size); there is no bundle discount.
export default function FrequentlyBought({ main, companions }: { main: BundleItem; companions: BundleItem[] }) {
  const { addItem } = useCart();
  const all = [main, ...companions];
  const [checked, setChecked] = useState<string[]>(() => all.filter((item) => item.inStock).map((item) => item.slug));
  const [added, setAdded] = useState(false);
  const chosen = all.filter((item) => checked.includes(item.slug) && item.inStock);
  const total = chosen.reduce((sum, item) => sum + parsePrice(item.price), 0);

  function addAll() {
    chosen.forEach((item) => addItem({ slug: item.slug, variantId: item.sku, title: `${item.title} • ${item.sizeLabel}`, price: parsePrice(item.price), priceLabel: item.price, quantity: 1 }));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  return (
    <section aria-labelledby="fbt-heading" className="rounded-2xl border border-[color:var(--brand-line)] bg-white p-5 sm:p-6">
      <h2 id="fbt-heading" className="text-xl font-bold text-slate-900">Frequently bought together</h2>
      <p className="mt-1 text-sm text-slate-600">Selected items are added at their listed {main.sizeLabel} prices. Change sizes in the cart.</p>
      <ul className="mt-4 divide-y divide-[color:var(--brand-line)]">
        {all.map((item) => (
          <li key={item.slug} className="flex items-center gap-3 py-3">
            <input id={`fbt-${item.slug}`} type="checkbox" disabled={!item.inStock} checked={checked.includes(item.slug) && item.inStock} onChange={() => setChecked((list) => (list.includes(item.slug) ? list.filter((s) => s !== item.slug) : [...list, item.slug]))} className="h-5 w-5 accent-[color:var(--brand-deep-green)]" />
            <label htmlFor={`fbt-${item.slug}`} className="min-w-0 flex-1 text-sm">
              <span className="font-semibold text-slate-900">{item.title}</span>
              <span className="block text-slate-500">{item.sizeLabel}{item.slug === main.slug ? " · this item" : ""}{!item.inStock ? " · out of stock" : ""}</span>
            </label>
            <span className="shrink-0 text-sm font-semibold text-slate-900">{item.price}</span>
            {item.slug !== main.slug && <Link href={`/products/${item.slug}`} className="shrink-0 text-xs font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">View</Link>}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--brand-line)] pt-4">
        <p className="text-sm text-slate-600">{chosen.length} {chosen.length === 1 ? "item" : "items"} · <strong className="text-lg text-slate-900">{formatCurrency(total)}</strong></p>
        <button type="button" onClick={addAll} disabled={chosen.length === 0} className="brand-btn px-6 disabled:opacity-50">{added ? "Added to cart ✓" : "Add selected to cart"}</button>
      </div>
    </section>
  );
}
