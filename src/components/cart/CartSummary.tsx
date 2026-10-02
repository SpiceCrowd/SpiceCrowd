"use client";

import { useCart } from "./CartProvider";
import { calculateCartTotals, formatCurrency } from "@/lib/cart";
import Link from "next/link";

export default function CartSummary({ discount = 0 }: { discount?: number }) {
  const { items, cartCount } = useCart();
  const totals = calculateCartTotals(items, 50);
  const totalAfterDiscount = Math.max(0, totals.total - discount);

  if (!cartCount) {
    return (
      <div className="checkout-card p-4 text-center shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--brand-gold)]/25 text-[color:var(--brand-deep-green)] ring-8 ring-[color:var(--brand-gold)]/20">
          <span className="text-xl font-bold">0</span>
        </div>
        <p className="mt-3 text-base font-semibold text-slate-950">Your cart is empty</p>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">Add spices from the catalog to see them here.</p>
        <Link href="/products" className="brand-btn mt-4 px-5 py-2.5 hover:-translate-y-0.5">
          Shop spices
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-card p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Order summary</p>
      <div className="mt-3.5 space-y-2">
        {items.map((item) => (
          <div key={item.slug} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
            <div>
              <p className="font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.quantity} × {item.priceLabel}</p>
            </div>
            <p className="text-sm font-semibold text-slate-950">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-3.5 text-sm text-slate-700">
        <div className="flex items-center justify-between text-slate-600">
          <span>Items</span>
          <span>{cartCount}</span>
        </div>
        {discount > 0 && <div className="mt-3 flex items-center justify-between text-emerald-700"><span>Discount</span><span>-₹{discount}</span></div>}
        <div className="mt-3 flex items-center justify-between font-semibold text-slate-950">
          <span>Total</span>
          <span>{formatCurrency(totalAfterDiscount)}</span>
        </div>
      </div>
    </div>
  );
}
