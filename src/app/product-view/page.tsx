"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductSingleView from "@/components/product/ProductSingleView";
import type { Product } from "@/lib/products";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

type ProductListResponse = {
  products?: Product[];
};

function ProductViewContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || undefined;

  const orderedProducts = useMemo(() => {
    if (!slug) return products;
    const selectedIndex = products.findIndex((product) => product.slug === slug);
    if (selectedIndex <= 0) return products;

    const selected = products[selectedIndex];
    return [selected, ...products.slice(0, selectedIndex), ...products.slice(selectedIndex + 1)];
  }, [products, slug]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/products')
      .then((r) => r.json() as Promise<ProductListResponse | Product[]>)
      .then((j) => {
        if (!mounted) return;
        setProducts(Array.isArray(j) ? j : j.products || []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading product view...</div>
        </main>
        <Footer />
      </>
    );
  }
  if (!products || products.length === 0) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No products available</div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <ProductSingleView products={orderedProducts} initialSlug={slug} />
      <Footer />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <ProductViewContent />
    </Suspense>
  );
}
