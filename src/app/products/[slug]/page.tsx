import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import { getProduct, type Product } from "@/lib/products";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

type ProductPageParams = {
  slug: string;
};

async function fetchProduct(slug: string): Promise<Product | null> {
  const staticProduct = getProduct(slug) ?? null;
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/products?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { product?: Partial<Product> | null };
    if (!json.product) {
      return staticProduct;
    }
    // The live API can return a slimmer, admin-managed record (e.g. current stock/price).
    // Merge it over the full static catalog entry so descriptive fields are never missing.
    return staticProduct ? { ...staticProduct, ...json.product } : (json.product as Product);
  } catch {
    return staticProduct;
  }
}


export default async function ProductDetailPage({ params }: { params: Promise<ProductPageParams> | ProductPageParams }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const product = await fetchProduct(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header />
      <ProductDetailClient product={product} />
      <Footer />
    </>
  );
}
