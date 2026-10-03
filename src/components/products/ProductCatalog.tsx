"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/lib/products";
import PromoStrip from "@/components/pricing/PromoStrip";

export default function ProductCatalog({ products }: { products: Product[] }) {
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(1000);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const price = Number(product.price.replace(/[^0-9.]/g, "")) || 0;
      return price <= maxPrice;
    });

    return [...filtered].sort((a, b) => {
      const priceA = Number(a.price.replace(/[^0-9.]/g, "")) || 0;
      const priceB = Number(b.price.replace(/[^0-9.]/g, "")) || 0;
      if (sort === "price-low") return priceA - priceB;
      if (sort === "price-high") return priceB - priceA;
      return 0;
    });
  }, [maxPrice, products, sort]);

  return (
    <>
      <div className="mt-10 flex flex-col gap-4 border-y border-[color:var(--brand-line)] py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Showing {visibleProducts.length} of {products.length} products</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Up to</span>
            <select aria-label="Filter by maximum price" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="form-input min-w-32 py-2">
              <option value={1000}>Any price</option>
              <option value={50}>₹50</option>
              <option value={100}>₹100</option>
              <option value={150}>₹150</option>
              <option value={250}>₹250</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Sort</span>
            <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)} className="form-input min-w-40 py-2">
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>

      <PromoStrip className="mt-4" />

      {visibleProducts.length === 0 ? (
        <div className="empty-state mt-6">
          <p className="empty-state-title">No products match this price</p>
          <p className="empty-state-copy">Choose a higher price limit to see more spices.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product, index) => <div key={product.slug} className="reveal" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}><ProductCard product={product} /></div>)}
        </div>
      )}
    </>
  );
}
