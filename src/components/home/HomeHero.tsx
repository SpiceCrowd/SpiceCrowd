import Image from "next/image";
import Link from "next/link";
import PromoStrip from "@/components/pricing/PromoStrip";
import { getCatalogFacts, getHeroProducts } from "@/lib/homeData";

export default function HomeHero() {
  const facts = getCatalogFacts();
  const featured = getHeroProducts();
  return (
    <section className="bg-[color:var(--brand-deep-green)] text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:gap-12 lg:px-8 lg:py-16">
        <div className="max-w-xl">
          <p className="eyebrow">Kolli Hills, Tamil Nadu</p>
          <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">Spices from the Kolli Hills, packed fresh for your kitchen</h1>
          <p className="mt-5 text-base leading-7 text-white/80">
            Spice Crowd sells whole spices, ground powders, masalas, coffee and honey from our home in the Kolli Hills and trusted growers across India. Each product page names exactly where it comes from.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/products" className="inline-flex items-center justify-center rounded-xl bg-[color:var(--brand-gold)] px-6 py-3.5 text-sm font-bold text-[color:var(--brand-deep-green)] shadow-lg transition hover:brightness-110">Shop all spices</Link>
            <Link href={facts.kolliHillsHref} className="inline-flex items-center justify-center rounded-xl border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Shop the Kolli Hills range</Link>
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/15 pt-5 text-sm">
            <div><dt className="text-white/60">In the catalogue</dt><dd className="font-semibold">{facts.count} products</dd></div>
            <div><dt className="text-white/60">From Kolli Hills</dt><dd className="font-semibold">{facts.kolliHillsCount} products</dd></div>
            <div><dt className="text-white/60">Prices start at</dt><dd className="font-semibold">₹{facts.fromPrice}</dd></div>
          </dl>
          <PromoStrip kind="free_shipping" className="mt-4 [&_li]:!text-[color:var(--brand-gold)]" />
        </div>
        <div className="grid grid-cols-2 gap-4" aria-label="Featured products">
          {featured.map((product) => (
            <Link key={product.slug} href={`/products/${product.slug}`} className="group overflow-hidden rounded-2xl bg-[color:var(--brand-cream)] text-slate-900 transition hover:-translate-y-0.5 hover:shadow-xl">
              <div className="relative aspect-square">
                <Image src={`/images/${product.slug}.svg`} alt={product.title} fill priority sizes="(max-width: 768px) 45vw, 22vw" className="object-cover" />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold sm:text-base">{product.title}</p>
                <p className="mt-1 text-sm text-slate-600">{product.price} · 100g</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--brand-deep-green)] group-hover:underline">View product →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
