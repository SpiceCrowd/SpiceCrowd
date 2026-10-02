"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { useEffect, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/lib/products";

type ProductResponse = {
  product?: Product | null;
};

export default function WishlistPage() {
  const { items: slugs } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!slugs || slugs.length === 0) {
        setProducts([]);
        return;
      }
      try {
        const ps = await Promise.all(
          slugs.map(async (slug) => {
            const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`);
            const json = (await res.json()) as ProductResponse;
            return json.product || null;
          }),
        );
        setProducts(ps.filter((product): product is Product => Boolean(product)));
      } catch {
        setProducts([]);
      }
    };
    load();
  }, [slugs]);

  return (
    <>
      <Header />
      <main className="bg-[radial-gradient(circle_at_top_right,_color-mix(in_srgb,var(--brand-gold)_15%,white),_transparent_35%),linear-gradient(180deg,_#fff,_#f8fafc)] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="rounded-[1.8rem] border border-[color:var(--brand-gold)]/45 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-deep-green)]">Wishlist</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Your Saved Spices</h1>
            <p className="mt-2 text-sm text-slate-600">Saved spices you may want to buy later.</p>
          </section>

          {products.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-base font-semibold text-slate-900">No items in your wishlist</p>
              <p className="mt-2 text-sm text-slate-600">You can add items to your wishlist from the product cards.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
