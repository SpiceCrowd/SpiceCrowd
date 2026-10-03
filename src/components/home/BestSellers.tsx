import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import { getBestSellers } from "@/lib/homeData";

export default async function BestSellers() {
  const { products, fromOrders } = await getBestSellers(4);
  return (
    <section aria-labelledby="best-sellers-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{fromOrders ? "Most ordered" : "Start here"}</p>
          <h2 id="best-sellers-heading" className="section-heading mt-2">{fromOrders ? "Best Sellers" : "Kolli Hills essentials to start with"}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            {fromOrders ? "The products customers order most often." : "Everyday staples that suit most kitchens. Each one is priced per 100g, with larger sizes on the product page."}
          </p>
        </div>
        <Link href="/products" className="text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">View all products →</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => <ProductCard key={product.slug} product={product} />)}
      </div>
    </section>
  );
}
