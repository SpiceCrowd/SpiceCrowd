"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type WishlistContextValue = {
  items: string[];
  has: (slug: string) => boolean;
  add: (slug: string) => void;
  remove: (slug: string) => void;
  toggle: (slug: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const WISHLIST_KEY = "spicecrowd_wishlist";

function getInitialWishlistItems(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(WISHLIST_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(getInitialWishlistItems);

  useEffect(() => {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  }, [items]);

  const add = (slug: string) => setItems((cur) => (cur.includes(slug) ? cur : [...cur, slug]));
  const remove = (slug: string) => setItems((cur) => cur.filter((s) => s !== slug));
  const toggle = (slug: string) => setItems((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  const has = (slug: string) => items.includes(slug);

  return (
    <WishlistContext.Provider value={{ items, has, add, remove, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
