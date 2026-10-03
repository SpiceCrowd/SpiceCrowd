import Link from "next/link";
import { getCatalogFacts } from "@/lib/homeData";

// Points drawn from the existing About copy and catalogue structure; no unverified product claims.
const pillars = [
  { title: "A named origin", body: "Most of our range comes from the Kolli Hills of Tamil Nadu, where Spice Crowd began. Every product page states its origin." },
  { title: "Trusted growers", body: "We source selected spices, coffee and honey from producer communities across India, with fair sourcing and careful quality checks." },
  { title: "Packed fresh", body: "Spices are packed with care so every packet cooks like home." },
  { title: "Sizes and prices in the open", body: "Most products come in 100g, 250g, 500g and 1kg. The price you see is the price per size." },
];

export default function WhyChooseUs() {
  const facts = getCatalogFacts();
  return (
    <section aria-labelledby="why-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <p className="eyebrow">Why Spice Crowd</p>
          <h2 id="why-heading" className="section-heading mt-2">Know where your spices come from</h2>
          <Link href={facts.kolliHillsHref} className="mt-6 inline-flex text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">See all {facts.kolliHillsCount} Kolli Hills products →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-2xl border border-[color:var(--brand-line)] bg-white p-6">
              <h3 className="text-base font-semibold text-slate-900">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
