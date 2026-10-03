"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { calculateCartTotals, cartLineKey, couponStorageKey, formatCurrency, maxProductStock } from "@/lib/cart";
import { normalizeCouponCode } from "@/lib/promotions";
import { useQuote } from "@/components/pricing/useQuote";
import QuoteBreakdown from "@/components/pricing/QuoteBreakdown";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

export default function CartPage() {
  const { items, cartCount, updateQuantity, removeItem, clearCart } = useCart();
  const totals = calculateCartTotals(items, 0);
  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const { quote, loading, error } = useQuote(items, "standard", couponCode);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(couponStorageKey) || "";
      setCouponCode(stored);
      setCouponInput(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function applyCoupon() {
    const code = normalizeCouponCode(couponInput);
    setCouponCode(code);
    setCouponInput(code);
    if (code) window.localStorage.setItem(couponStorageKey, code);
    else window.localStorage.removeItem(couponStorageKey);
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponInput("");
    window.localStorage.removeItem(couponStorageKey);
  }

  if (!cartCount) {
    return (
      <>
        <Header />
        <main className="brand-page-bg mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="empty-state py-8 sm:py-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand-gold)]/25 text-[color:var(--brand-deep-green)] ring-8 ring-[color:var(--brand-gold)]/20">
              <span className="text-xl font-bold">0</span>
            </div>
            <p className="mt-4 text-base font-semibold text-slate-950 sm:text-lg">Your cart is empty</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">Add your favorite spices from the catalog to continue.</p>
            <Link href="/products" className="brand-btn mt-6 px-6 hover:-translate-y-0.5">
              Browse Spices
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="brand-page-bg mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--brand-deep-green)]">Your Cart</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Review your order</h1>
        </div>
        <button
          type="button"
          onClick={() => clearCart()}
          className="brand-btn-outline"
        >
          Clear cart
        </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.8fr]">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={cartLineKey(item)} className="form-shell p-3.5 sm:p-4">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{item.priceLabel}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.slug, item.quantity - 1, item.variantId)}
                    className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-[color:var(--brand-deep-green)]/35 hover:bg-[color:var(--brand-deep-green)]/10"
                  >
                    -
                  </button>
                  <span className="min-w-[2rem] rounded-full bg-slate-100 px-2.5 py-0.5 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.slug, item.quantity + 1, item.variantId)}
                    disabled={item.quantity >= maxProductStock}
                    title={item.quantity >= maxProductStock ? `Only ${maxProductStock} available` : "Increase quantity"}
                    className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-[color:var(--brand-deep-green)]/35 hover:bg-[color:var(--brand-deep-green)]/10"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.slug, item.variantId)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--brand-gold)] hover:text-[color:var(--brand-deep-green)]"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-[1.25rem] bg-slate-50 px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Item total</span>
                <span className="font-semibold text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
              </div>
              {item.quantity >= maxProductStock && (
                <p className="mt-2 text-xs font-semibold text-[color:var(--brand-deep-green)]">Only {maxProductStock} available</p>
              )}
            </div>
          ))}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="form-shell p-5 sm:p-5.5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Cart summary</p>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Items</span>
                <span>{totals.itemCount}</span>
              </div>
              <div className="flex gap-2">
                <input value={couponInput} onChange={(event) => setCouponInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applyCoupon(); }} placeholder="Coupon code" aria-label="Coupon code" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <button type="button" onClick={applyCoupon} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Apply</button>
                {couponCode && <button type="button" onClick={removeCoupon} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Remove</button>}
              </div>
              {quote?.coupon?.status === "applied" && <p className="text-xs text-emerald-700">{quote.coupon.code} applied: {formatCurrency(quote.coupon.discount || 0)} off</p>}
              <QuoteBreakdown quote={quote} loading={loading} error={error} />
            </div>
            <Link
              href="/checkout"
              aria-disabled={!quote || Boolean(error)}
              className={`brand-btn mt-4 w-full justify-center px-6 hover:-translate-y-0.5 ${!quote || error ? "pointer-events-none opacity-60" : ""}`}
            >
              Proceed to checkout
            </Link>
          </div>
        </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
