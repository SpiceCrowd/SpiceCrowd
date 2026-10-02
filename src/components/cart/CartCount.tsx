"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartCount() {
  const { cartCount } = useCart();

  return (
    <Link
      href="/cart"
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[color:var(--brand-gold)]"
    >
      <span>🛍️</span>
      <span>Cart</span>
      {cartCount > 0 ? (
        <span className="rounded-full bg-[color:var(--brand-deep-green)] px-2 py-0.5 text-xs font-semibold text-[color:var(--brand-gold)]">{cartCount}</span>
      ) : null}
    </Link>
  );
}
