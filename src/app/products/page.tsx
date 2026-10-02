import { getProducts } from "@/lib/products";
import ProductCatalog from "@/components/products/ProductCatalog";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

export default function ProductsPage() {
  const products = getProducts();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[color:var(--brand-deep-green)]">All Spices</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Browse our full catalog</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Explore our range of hill-grown spices, each handpicked for freshness, flavor, and purity.
          </p>
        </div>
        <ProductCatalog products={products} />
      </main>
      <Footer />
    </>
  );
}
