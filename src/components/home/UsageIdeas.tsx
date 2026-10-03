import Link from "next/link";
import { getUsageProducts } from "@/lib/homeData";

// Usage notes come straight from each product's own guide.
export default function UsageIdeas() {
  return (
    <section id="cook-with-spice-crowd" aria-labelledby="usage-heading" className="mx-auto max-w-7xl scroll-mt-32 px-4 sm:px-6 lg:px-8">
      <p className="eyebrow">In your kitchen</p>
      <h2 id="usage-heading" className="section-heading mt-2">How to use them</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Three ideas from our usage guides. Every product page has its own notes and pairings.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {getUsageProducts().map((product) => (
          <article key={product.slug} className="flex flex-col rounded-2xl border border-[color:var(--brand-line)] bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">{product.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-700">{product.usage}</p>
            <Link href={`/products/${product.slug}`} className="mt-5 text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">See {product.title} →</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
