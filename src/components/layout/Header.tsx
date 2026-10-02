"use client";

import Link from "next/link";
import { useState } from "react";
import CartCount from "@/components/cart/CartCount";
import { useAuth } from "@/components/auth/AuthProvider";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Spices", href: "/products" },
  { label: "Masalas", href: "/#masalas" },
  { label: "Gift Packs", href: "/#gift-packs" },
  { label: "Offers", href: "/#offers" },
  { label: "About Us", href: "/#about-us" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const accountLabel = user?.name?.trim() || user?.email || "Sign In";

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--brand-line)]/90 bg-[color:var(--brand-ivory)]/98">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--brand-deep-green)] text-lg text-[color:var(--brand-gold)] shadow-sm">✦</div>
            <div className="min-w-0">
              <p className="font-serif text-2xl leading-none text-slate-950">Spice Crowd</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">Pure Indian Spices</p>
            </div>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex w-full max-w-xl items-center overflow-hidden rounded-xl border border-[color:var(--brand-line)] bg-white shadow-sm">
            <input
              aria-label="Search for spices"
              placeholder="Search for spices, masalas, coffee..."
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none"
            />
            <button className="flex h-12 w-12 items-center justify-center bg-[color:var(--brand-deep-green)] text-xl text-[color:var(--brand-gold)] transition hover:bg-[color:var(--brand-maroon-700)]">⌕</button>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--brand-line)] text-xl text-slate-700 transition hover:border-[color:var(--brand-gold)] md:hidden"
          >
            {menuOpen ? "×" : "☰"}
          </button>
          <div className="hidden items-center gap-4 text-sm font-medium text-slate-700 md:flex">
            <a href="/account" className="inline-flex items-center gap-2">
              <span className="text-lg">◌</span>
              <span>{accountLabel}</span>
            </a>
            <a href="/wishlist" className="inline-flex items-center gap-2">
              <span className="text-lg">♡</span>
              <span>Wishlist</span>
            </a>
            <div className="flex items-center gap-1">
              <span className="text-lg">🛒</span>
              <CartCount />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[color:var(--brand-line)]/80 bg-[color:var(--brand-ivory)]">
        <nav className={`${menuOpen ? "flex" : "hidden"} mx-auto max-w-7xl flex-col gap-1 px-4 py-3 text-sm font-medium text-slate-700 md:flex md:flex-row md:items-center md:justify-center md:gap-2`}>
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="whitespace-nowrap rounded-lg border-b-2 border-transparent px-3 py-2 transition hover:border-[color:var(--brand-deep-green)] hover:text-[color:var(--brand-deep-green)]">
              {item.label}
            </a>
          ))}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 md:hidden">
            <a href="/account" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2">{accountLabel}</a>
            <a href="/wishlist" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2">Wishlist</a>
            <a href="/cart" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2">Cart</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
