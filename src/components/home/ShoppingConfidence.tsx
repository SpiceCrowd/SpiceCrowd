"use client";

import Link from "next/link";
import { usePromotions } from "@/components/pricing/useQuote";
import { shippingRates } from "@/lib/promotionConfig";

// Delivery and return facts come from the live shipping rates; offers come from the same engine that prices orders.
export default function ShoppingConfidence() {
  const { promotions } = usePromotions();
  return (
    <section id="offers" aria-labelledby="confidence-heading" className="mx-auto max-w-7xl scroll-mt-32 px-4 sm:px-6 lg:px-8">
      <p className="eyebrow">Ordering with us</p>
      <h2 id="confidence-heading" className="section-heading mt-2">Delivery, returns and current offers</h2>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--brand-line)] bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Delivery</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
            <li>Standard: ₹{shippingRates.standard}, 3-5 days</li>
            <li>Express: ₹{shippingRates.express}, 1-2 days</li>
          </ul>
          <Link href="/support#shipping" className="mt-4 inline-block text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">Shipping details →</Link>
        </div>
        <div className="rounded-2xl border border-[color:var(--brand-line)] bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Returns and support</h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">Request a return or refund from your order page, and track every order from your account.</p>
          <div className="mt-4 flex gap-4 text-sm font-semibold text-[color:var(--brand-deep-green)]">
            <Link href="/support#returns" className="underline-offset-4 hover:underline">Return policy →</Link>
            <Link href="/account/orders" className="underline-offset-4 hover:underline">My orders →</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/12 p-6">
          <h3 className="text-base font-semibold text-slate-900">Offers running now</h3>
          {promotions.length ? (
            <ul className="mt-3 space-y-3 text-sm text-slate-800">
              {promotions.map((promo) => (
                <li key={promo.id}>
                  <p className="font-semibold">{promo.headline}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{promo.conditions.filter((c) => !c.startsWith("Minimum order") && c !== promo.headline).join(" · ")}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-700">There are no offers running right now.</p>
          )}
          <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">Shop now →</Link>
        </div>
      </div>
    </section>
  );
}
