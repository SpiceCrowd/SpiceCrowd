import Link from "next/link";
import { site } from "@/config/site";

const sectionCards = {
  masalas: [
    { title: "Sambar Masala", note: "South Indian daily staple", href: "/products?q=sambar+masala" },
    { title: "Garam Masala", note: "Warm finishing blend", href: "/products?q=garam+masala" },
    { title: "Chettinad Blend", note: "Roasted spice-forward profile", href: "/products?q=chettinad+blend" },
  ],
  giftPacks: [
    { title: "Starter Spice Kit", note: "Perfect first gift", href: "/products?q=starter+spice+kit" },
    { title: "Family Festival Pack", note: "Seasonal favorite bundle", href: "/products?q=family+pack" },
    { title: "Chef Selection Box", note: "Curated premium set", href: "/products?q=chef+selection" },
  ],
};

type SectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cards: Array<{ title: string; note: string; href: string }>;
  tone: "slate" | "gold" | "green";
};

function TabSection({ id, eyebrow, title, subtitle, cards, tone }: SectionProps) {
  const toneClass =
    tone === "gold"
      ? "border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/14"
      : tone === "green"
      ? "border-[color:var(--brand-deep-green)]/30 bg-[color:var(--brand-deep-green)]/8"
      : "border-slate-200 bg-white";

  return (
    <section id={id} className="scroll-mt-36 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className={`surface-lift rounded-2xl border p-7 sm:p-9 ${toneClass}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-heading mt-3">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">{subtitle}</p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="surface-lift block rounded-xl border border-[color:var(--brand-line)] bg-white p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{card.note}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-deep-green)]">View products</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomeTabsSections() {
  return (
    <>
      <TabSection
        id="masalas"
        eyebrow="Masalas"
        title="Everyday Masala Essentials"
        subtitle="Freshly milled blends for curries, dals, gravies, and one-pot cooking."
        cards={sectionCards.masalas}
        tone="gold"
      />
      <TabSection
        id="gift-packs"
        eyebrow="Gift Packs"
        title="Curated Spice Gifts"
        subtitle="Thoughtful bundles for festivals, hosting, and kitchen-loving families."
        cards={sectionCards.giftPacks}
        tone="slate"
      />
      <section id="offers" className="scroll-mt-36 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/15 p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--brand-deep-green)]">Offers</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-slate-900 sm:text-4xl">Seasonal Offers and Savings</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Flat 10% on orders above Rs.999</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Free shipping above Rs.299</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Bundle discounts up to 15%</p>
            </div>
          </div>
        </div>
      </section>
      <section id="about-us" className="scroll-mt-36 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[color:var(--brand-deep-green)]/28 bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,var(--brand-deep-green)_14%,white),_transparent_32%),radial-gradient(circle_at_bottom_right,_color-mix(in_srgb,var(--brand-gold)_24%,white),_transparent_30%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-8 sm:p-10">
          <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--brand-deep-green)]">About Us</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-slate-900 sm:text-4xl">From Kolli Hills to Your Kitchen</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Spice Crowd began in Kolli Hills, Tamil Nadu, where the hill climate and farming traditions shape our love for honest, aromatic ingredients.
                Today, we source selected spices, coffee, honey, and regional ingredients from trusted growers and producer communities across India.
                We bring them together with careful quality checks, fair sourcing, and fresh packing so every packet cooks like home.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Origin</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Kolli Hills roots</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Promise</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Sourced across India</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Goal</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Consistent flavor every cook</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/products" className="brand-btn px-5 py-2.5">
                  Explore Our Spices
                </Link>
                <Link href="/support" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--brand-gold)] hover:text-[color:var(--brand-deep-green)]">
                  Read Our Story
                </Link>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Visit our home base</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">{site.address.line1}</p>
              <p className="mt-1 text-sm text-slate-600">{site.address.city}, {site.address.state} {site.address.postcode}</p>
              <a href={site.mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-[color:var(--brand-deep-green)] px-4 py-2.5 text-sm font-semibold text-[color:var(--brand-gold)] transition hover:-translate-y-0.5">
                Open location map
              </a>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Our Process</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-deep-green)]">01 Source</p>
                  <p className="mt-1 text-sm text-slate-700">Direct from selected small farms and grower groups.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-deep-green)]">02 Test</p>
                  <p className="mt-1 text-sm text-slate-700">Cleaned and checked for aroma, color, and consistency.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-deep-green)]">03 Pack</p>
                  <p className="mt-1 text-sm text-slate-700">Packed fresh to lock flavor before it reaches your kitchen.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
