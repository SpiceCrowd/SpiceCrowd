import Link from "next/link";
import { getCategorySummaries } from "@/lib/homeData";

export default function Categories() {
  const categories = getCategorySummaries();
  return (
    <section aria-labelledby="categories-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <p className="eyebrow">Explore</p>
      <h2 id="categories-heading" className="section-heading mt-2">Shop by category</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.name} href={category.href} className="group flex flex-col justify-between rounded-2xl border border-[color:var(--brand-line)] bg-white p-5 transition hover:border-[color:var(--brand-gold)] hover:shadow-md">
            <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
            <p className="mt-6 text-sm text-slate-600">{category.count} {category.count === 1 ? "product" : "products"} · from ₹{category.fromPrice}</p>
            <p className="mt-2 text-sm font-semibold text-[color:var(--brand-deep-green)] group-hover:underline">Browse {category.name.toLowerCase()} →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
