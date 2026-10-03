import Link from "next/link";
import { getCatalogFacts } from "@/lib/homeData";

// Story copy is the existing About text, unchanged in substance.
export default function KolliHillsStory() {
  const facts = getCatalogFacts();
  return (
    <section id="about-us" aria-labelledby="story-heading" className="mx-auto max-w-7xl scroll-mt-32 px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-[color:var(--brand-cream)] p-8 sm:p-10 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <p className="eyebrow">Our story</p>
            <h2 id="story-heading" className="section-heading mt-2">From Kolli Hills to your kitchen</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700">
              Spice Crowd began in Kolli Hills, Tamil Nadu, where the hill climate and farming traditions shape our love for honest, aromatic ingredients.
              Today we source selected spices, coffee, honey and regional ingredients from trusted growers and producer communities across India, with careful quality checks, fair sourcing and fresh packing.
            </p>
            <Link href={facts.kolliHillsHref} className="brand-btn mt-7">Shop the Kolli Hills range</Link>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Origin</dt><dd className="mt-1 font-semibold text-slate-900">Kolli Hills, Tamil Nadu</dd></div>
            <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sourcing</dt><dd className="mt-1 font-semibold text-slate-900">Trusted growers across India</dd></div>
            <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Range</dt><dd className="mt-1 font-semibold text-slate-900">{facts.kolliHillsCount} Kolli Hills products</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
