"use client";

import { formatCurrency } from "@/lib/cart";
import type { Quote } from "@/lib/promotions";

export default function QuoteBreakdown({ quote, loading, error }: { quote: Quote | null; loading: boolean; error: string | null }) {
  if (error) return <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>;
  if (!quote) return <p className="text-sm text-slate-500">Calculating your total…</p>;

  const discounts = quote.promotions.filter((promo) => promo.kind === "discount");
  const couponNote = quote.coupon && quote.coupon.status !== "applied" ? quote.coupon.message : null;

  return (
    <div className={`space-y-2.5 text-sm text-slate-600 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
      <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
      {discounts.map((promo) => (
        <div key={promo.id} className="flex items-center justify-between gap-3 text-emerald-700">
          <span>{promo.code ? `Coupon ${promo.code}` : promo.title}</span>
          <span className="shrink-0">-{formatCurrency(promo.amount)}</span>
        </div>
      ))}
      {couponNote && <p className="text-xs text-amber-700">{couponNote}</p>}
      <div className="flex items-center justify-between">
        <span>Delivery</span>
        <span>
          {quote.shipping.discount > 0 && <s className="mr-1 text-slate-400">{formatCurrency(quote.shipping.baseCost)}</s>}
          {quote.shipping.cost === 0 ? <span className="font-semibold text-emerald-700">Free</span> : formatCurrency(quote.shipping.cost)}
        </span>
      </div>
      {quote.tax > 0 && <div className="flex items-center justify-between"><span>GST</span><span>{formatCurrency(quote.tax)}</span></div>}
      <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-lg font-semibold text-slate-900">
        <span>Total</span>
        <span>{formatCurrency(quote.total)}</span>
      </div>
      {quote.nudges.slice(0, 2).map((nudge) => (
        <p key={nudge.promotionId} className="rounded-lg bg-[color:var(--brand-gold)]/15 px-3 py-2 text-xs text-slate-700">
          Add {formatCurrency(nudge.remaining)} more to unlock: {nudge.title}
        </p>
      ))}
    </div>
  );
}
