"use client";

import { useCart } from "@/components/cart/CartProvider";
import { parsePrice } from "@/lib/cart";

const packs = [
  {
    title: "Essential Combo",
    description: "10 Spices Pack",
    price: "₹999",
    badge: "Popular",
    features: ["10 essential daily spices", "Serves family of 5", "Free delivery"],
  },
  {
    title: "3-Month Family Pack",
    description: "10 Spices x 3 Months",
    price: "₹2,699",
    badge: "Best Value",
    features: ["10 spices in bulk", "Lasts 3 months", "Includes rare spice bonus"],
    highlight: true,
  },
  {
    title: "6-Month Family Pack",
    description: "10 Spices x 6 Months",
    price: "₹4,999",
    badge: "Premium",
    features: ["10 spices large qty", "Lasts 6 months", "Priority delivery"],
  },
  {
    title: "Yearly Family Pack",
    description: "10 Spices x 12 Months",
    price: "₹8,999",
    badge: "Ultimate",
    features: ["Full year supply", "2 rare spices", "Festival bonus"],
  },
];

export default function ComboPacks() {
  const { addItem } = useCart();

  const addPackToCart = (pack: (typeof packs)[number]) => {
    addItem({
      slug: `combo-${pack.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: pack.title,
      price: parsePrice(pack.price),
      priceLabel: pack.price,
      quantity: 1,
    });
  };

  return (
    <section className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Spice Combo Packs</p>
        <h2 className="section-heading mt-3">Complete spice sets for your family of 5</h2>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {packs.map((pack) => (
          <div
            key={pack.title}
            className={`surface-lift rounded-2xl border p-6 shadow-sm ${pack.highlight ? "border-[color:var(--brand-gold)]/55 bg-[color:var(--brand-gold)]/12" : "border-[color:var(--brand-line)] bg-white"}`}
          >
            <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
              {pack.badge}
            </span>
            <h3 className="mt-6 text-2xl font-semibold text-slate-900">{pack.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{pack.description}</p>
            <p className="mt-6 text-3xl font-bold text-slate-900">{pack.price}</p>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-600">
              {pack.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--brand-deep-green)]" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => addPackToCart(pack)}
              className="mt-8 w-full rounded-xl bg-[color:var(--brand-deep-green)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-maroon-700)]"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
