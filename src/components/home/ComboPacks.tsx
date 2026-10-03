"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { parsePrice } from "@/lib/cart";
import type { getCombos } from "@/lib/homeData";

// Every combo is a set of real catalogue products at their listed prices; there is no bundle discount.
export default function ComboPacks({ combos }: { combos: ReturnType<typeof getCombos> }) {
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const addCombo = (combo: ReturnType<typeof getCombos>[number]) => {
    combo.items.forEach((product) => addItem({
      slug: product.slug,
      variantId: product.sizeOptions?.[0]?.sku,
      title: product.title,
      price: parsePrice(product.price),
      priceLabel: product.price,
      quantity: 1,
    }));
    setAddedId(combo.id);
    window.setTimeout(() => setAddedId((current) => (current === combo.id ? null : current)), 2500);
  };

  return (
    <section id="combos" aria-labelledby="combos-heading" className="mx-auto max-w-7xl scroll-mt-32 px-4 sm:px-6 lg:px-8">
      <p className="eyebrow">Combo packs</p>
      <h2 id="combos-heading" className="section-heading mt-2">Ready-made sets, one click</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Each set adds real products to your cart at their listed 100g prices. You can change sizes and quantities in the cart.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {combos.map((combo) => (
          <div key={combo.id} className="flex flex-col rounded-2xl border border-[color:var(--brand-line)] bg-white p-6">
            <h3 className="text-xl font-semibold text-slate-900">{combo.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{combo.note}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
              {combo.items.map((product) => (
                <li key={product.slug} className="flex justify-between gap-3">
                  <Link href={`/products/${product.slug}`} className="underline-offset-2 hover:underline">{product.title}</Link>
                  <span className="shrink-0 text-slate-500">{product.price}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-[color:var(--brand-line)] pt-4 text-2xl font-bold text-[color:var(--brand-deep-green)]">₹{combo.total}<span className="ml-2 text-xs font-medium text-slate-500">for {combo.items.length} items</span></p>
            <button type="button" onClick={() => addCombo(combo)} className="mt-4 w-full rounded-full bg-[#0f4339] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123f36]">
              {addedId === combo.id ? "Added to cart ✓" : "Add all to cart"}
            </button>
          </div>
        ))}
      </div>
      <p className="sr-only" role="status">{addedId ? "Combo added to cart" : ""}</p>
    </section>
  );
}
