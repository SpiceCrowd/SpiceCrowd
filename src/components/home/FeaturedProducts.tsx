import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import { getSpecialtyProducts } from "@/lib/homeData";

export default function FeaturedProducts() {
  return (
    <section aria-labelledby="featured-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Featured</p>
          <h2 id="featured-heading" className="section-heading mt-2">Rarer finds and specialities</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Stone flower, honey, coffee and Malabar pepper: a step beyond the everyday staples.</p>
        </div>
        <Link href="/products" className="text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">Browse the full catalogue →</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {getSpecialtyProducts().map((product) => <ProductCard key={product.slug} product={product} />)}
      </div>
    </section>
  );
}
