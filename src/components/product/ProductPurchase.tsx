"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { cartLineKey, formatCurrency, maxProductStock, parsePrice } from "@/lib/cart";
import { mrpInfo, pickInitialSize, stockMessage, stockOf, type SizeOption } from "@/lib/productDetail";

type Summary = { slug: string; title: string; price: string; mrp: number | null; stock?: number };

function grams(label: string) {
  const match = label.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kg|g)$/);
  if (!match) return null;
  return Number(match[1]) * (match[2] === "kg" ? 1000 : 1);
}

const tone = { in: "text-emerald-700", low: "text-amber-700", out: "text-red-700" } as const;

export default function ProductPurchase({ product, sizes: initialSizes, initialSize }: { product: Summary; sizes: SizeOption[]; initialSize?: string | null }) {
  const router = useRouter();
  const { items, addItem } = useCart();
  const [sizes, setSizes] = useState(initialSizes);
  const [label, setLabel] = useState(() => pickInitialSize(initialSizes, product, initialSize)?.label ?? "");
  const [requested, setRequested] = useState("1");
  const [added, setAdded] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const addTimer = useRef<number | undefined>(undefined);

  const selected = sizes.find((size) => size.label === label) ?? sizes[0];
  const stock = stockOf(selected, product);
  const inCart = items.find((item) => cartLineKey(item) === cartLineKey({ slug: product.slug, variantId: selected?.sku }))?.quantity ?? 0;
  const addable = Math.max(0, Math.min(stock, maxProductStock) - inCart);
  const qty = Math.min(Math.max(1, Number(requested) || 1), Math.max(1, addable));
  const unit = selected ? parsePrice(selected.price) : 0;
  const status = stockMessage(stock);
  const saving = mrpInfo(product, selected);
  const weight = selected ? grams(selected.label) : null;
  const canBuy = addable > 0;
  const title = `${product.title}${selected ? ` • ${selected.label}` : ""}`;

  // Stock can change while the page is open, so re-read it whenever the tab becomes active again.
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`/api/products?slug=${encodeURIComponent(product.slug)}`, { cache: "no-store" });
        const data = await response.json();
        if (Array.isArray(data?.product?.sizeOptions)) setSizes(data.product.sizeOptions);
      } catch {
        // Keep showing the last known stock if the refresh fails.
      }
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [product.slug]);

  // The mobile bar appears only after the main buttons scroll away, and hides again at the footer.
  useEffect(() => {
    const target = ctaRef.current;
    if (!target) return;
    const footer = document.querySelector("footer");
    let ctaVisible = true;
    let footerVisible = false;
    const update = () => setStickyVisible(!ctaVisible && !footerVisible);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === target) ctaVisible = entry.isIntersecting;
        else footerVisible = entry.isIntersecting;
      }
      update();
    });
    observer.observe(target);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(addTimer.current), []);

  function choose(next: SizeOption) {
    setLabel(next.label);
    setRequested("1");
    const url = new URL(window.location.href);
    url.searchParams.set("size", next.label);
    window.history.replaceState(null, "", url);
  }

  function add() {
    if (!selected || !canBuy) return false;
    addItem({ slug: product.slug, variantId: selected.sku, title, price: unit, priceLabel: selected.price, quantity: qty });
    return true;
  }

  function handleAdd() {
    if (!add()) return;
    setAdded(true);
    window.clearTimeout(addTimer.current);
    addTimer.current = window.setTimeout(() => setAdded(false), 2500);
  }

  function handleBuyNow() {
    // A product already at its limit in the cart can still go straight to checkout.
    if (canBuy) add();
    router.push("/checkout");
  }

  const primary = "brand-btn w-full px-6 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-3xl font-bold text-slate-900 sm:text-4xl" aria-label={`Price ${selected?.price}`}>{selected?.price}</p>
        {saving && (
          <>
            <p className="text-lg text-slate-500 line-through" aria-label={`MRP ${formatCurrency(saving.mrp)}`}>{formatCurrency(saving.mrp)}</p>
            <p className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-semibold text-emerald-700">Save {formatCurrency(saving.savings)} ({saving.percent}%)</p>
          </>
        )}
      </div>
      {weight && unit > 0 && <p className="mt-1 text-sm text-slate-500">{formatCurrency((unit / weight) * 100)} per 100g</p>}

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-slate-900">Size{selected ? <span className="ml-2 font-normal text-slate-500">Net quantity: {selected.label}</span> : null}</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Choose a size">
          {sizes.map((size) => {
            const sizeStock = stockOf(size, product);
            const unavailable = sizeStock <= 0;
            const active = size.label === selected?.label;
            return (
              <button
                key={size.label}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={unavailable}
                onClick={() => choose(size)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${active ? "border-[color:var(--brand-deep-green)] bg-[color:var(--brand-cream)] ring-1 ring-[color:var(--brand-deep-green)]" : "border-[color:var(--brand-line)] bg-white hover:border-[color:var(--brand-gold)]"} ${unavailable ? "opacity-60" : ""}`}
              >
                <span className="block font-semibold text-slate-900">{size.label}</span>
                <span className="block text-slate-600">{size.price}</span>
                {unavailable && <span className="block text-xs font-semibold text-red-700">Out of stock</span>}
              </button>
            );
          })}
        </div>
      </fieldset>

      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 text-sm">
        <div><dt className="text-xs uppercase tracking-wide text-slate-500">Availability</dt><dd className={`font-semibold ${tone[status.tone]}`} role="status">{status.text}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-slate-500">SKU</dt><dd className="break-all font-mono text-xs font-semibold text-slate-900">{selected?.sku || "Not assigned"}</dd></div>
      </dl>

      <div className="mt-5">
        <label htmlFor="pdp-qty" className="text-sm font-semibold text-slate-900">Quantity</label>
        <div className="mt-2 flex items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-[color:var(--brand-line)] bg-white">
            <button type="button" aria-label="Decrease quantity" disabled={qty <= 1 || !canBuy} onClick={() => setRequested(String(qty - 1))} className="h-11 w-11 text-xl text-slate-700 disabled:opacity-40">−</button>
            <input
              id="pdp-qty"
              inputMode="numeric"
              value={canBuy ? requested : "0"}
              disabled={!canBuy}
              onChange={(event) => setRequested(event.target.value.replace(/\D/g, "").slice(0, 2))}
              onBlur={() => setRequested(String(qty))}
              aria-describedby="pdp-qty-note"
              className="h-11 w-12 bg-transparent text-center text-base font-semibold text-slate-900 focus:outline-none disabled:text-slate-400"
            />
            <button type="button" aria-label="Increase quantity" disabled={qty >= addable} onClick={() => setRequested(String(qty + 1))} className="h-11 w-11 text-xl text-slate-700 disabled:opacity-40">+</button>
          </div>
          {unit > 0 && canBuy && <p className="text-sm text-slate-600">Total <strong className="text-slate-900">{formatCurrency(unit * qty)}</strong></p>}
        </div>
        <p id="pdp-qty-note" aria-live="polite" className="mt-2 text-xs text-slate-500">
          {stock <= 0
            ? "This size is out of stock."
            : addable === 0
              ? <>You already have the maximum available ({inCart}) in your cart. <Link href="/cart" className="font-semibold underline">View cart</Link></>
              : inCart > 0
                ? `${inCart} already in your cart. You can add up to ${addable} more.`
                : `Up to ${addable} per order.`}
        </p>
      </div>

      <div ref={ctaRef} className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={handleAdd} disabled={!canBuy} className={primary}>{added ? "Added to cart ✓" : stock <= 0 ? "Out of stock" : "Add to Cart"}</button>
        <button type="button" onClick={handleBuyNow} disabled={stock <= 0} className="brand-btn-outline w-full px-6 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50">Buy Now</button>
      </div>
      <p className="sr-only" role="status">{added ? `${title} added to cart` : ""}</p>
      {added && <p className="mt-2 text-sm text-emerald-700">Added {qty} to your cart. <Link href="/cart" className="font-semibold underline">View cart</Link></p>}

      {stickyVisible && (
        <div id="pdp-sticky-bar" role="region" aria-label="Quick purchase" className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--brand-line)] bg-white/97 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{product.title}</p>
              <p className="text-sm text-slate-600">{selected?.label} · <strong className="text-slate-900">{selected?.price}</strong></p>
            </div>
            <button type="button" onClick={handleAdd} disabled={!canBuy} className="brand-btn shrink-0 px-5 py-3 disabled:opacity-50">{added ? "Added ✓" : stock <= 0 ? "Out of stock" : "Add to Cart"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
