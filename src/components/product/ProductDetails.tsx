"use client";
import React, { useState } from "react";
import type { Product } from "@/lib/products";
import PromoStrip from "@/components/pricing/PromoStrip";

type ProductDetailsData = Product & {
  badges?: string[];
  mrp?: string | number;
  pairs?: string[];
  save?: string;
  sizes?: string[];
  usageGuide?: string;
};

function formatPrice(price: string | number | undefined) {
  if (typeof price === "string") {
    return price;
  }

  return `₹${price ?? 0}`;
}

export default function ProductDetails({ product }: { product: ProductDetailsData }) {
  const [qty, setQty] = useState(1);
  const sizes = product.sizes || product.sizeOptions?.map((option) => option.label) || ["50g", "100g", "250g"];
  const [size, setSize] = useState(sizes[0]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold">{product.title || 'Untitled Product'}</h1>
        <div className="text-sm text-slate-600 mt-1">{product.tag || product.origin || ''}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="text-sm text-slate-700">{product.description || "Intensely aromatic whole cloves grown in Kolli Hills."}</div>
          <div className="mt-4 flex gap-2 flex-wrap">{(product.badges || ["100% Natural", "Sun Dried", "Hand Picked"]).map((b: string, i: number) => (
            <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">{b}</span>
          ))}</div>
        </div>

        <div className="md:col-span-1">
          <div className="border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold price-maroon">{formatPrice(product.price)}</div>
                {product.mrp && <div className="text-sm line-through text-slate-400">{formatPrice(product.mrp)}</div>}
              </div>
              {product.save && <div className="text-sm text-[color:var(--brand-deep-green)]">Save {product.save}</div>}
            </div>

            <div className="text-xs text-slate-400 mt-2">MRP (incl. of all taxes)</div>

            <div className="mt-4">
              <div className="text-sm text-slate-700 mb-2">Select Size</div>
              <div className="flex gap-2">
                {sizes.map((s: string) => (
                  <button key={s} type="button" onClick={() => setSize(s)} className={`px-3 py-2 rounded-md border text-sm ${s===size? 'border-brand bg-brand/5 text-brand':'border-slate-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2 border rounded-md px-2">
                <button type="button" onClick={() => setQty(Math.max(1, qty-1))} className="px-2">-</button>
                <div className="px-3">{qty}</div>
                <button type="button" onClick={() => setQty(qty+1)} className="px-2">+</button>
              </div>

              <div className="flex-1">
                <PromoStrip kind="free_shipping" />
                <div className="text-xs text-slate-500">Delivery by <strong>Tomorrow, 9 Aug</strong></div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button className="w-full rounded-md bg-[color:var(--brand-maroon)] text-white py-2">Buy Now</button>
              <button className="w-full rounded-md border border-[color:var(--brand-maroon)] text-[color:var(--brand-maroon)] py-2">Add to Cart</button>
            </div>

            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
              <div>Deliver to</div>
              <button className="text-[color:var(--brand-deep-green)] text-sm">Enter pincode</button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t">
        <h4 className="font-semibold">Usage Guide</h4>
        <div className="text-sm text-slate-700">{product.usageGuide || product.usage || "Store in an airtight container away from sunlight. Whole spices last 2–3 years."}</div>
      </div>

      <div>
        <h4 className="font-semibold">Pairs well with</h4>
        <div className="flex gap-2 mt-2">{(product.pairs || product.pairWith || ["Cinnamon", "Mace", "Nutmeg"]).map((p:string,i:number)=>(
          <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-sm">{p}</span>
        ))}</div>
      </div>
    </div>
  );
}
