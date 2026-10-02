"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AddToCartPayload, CartItem } from "@/lib/cart";
import { calculateCartTotals, cartStorageKey, maxProductStock } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  total: number;
  addItem: (item: AddToCartPayload) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_CART: CartItem[] = [];

function parseStoredCart() {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(cartStorageKey) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is CartItem => item && typeof item.slug === "string").map((item) => ({ ...item, quantity: Math.min(maxProductStock, Math.max(1, Number(item.quantity) || 1)) }))
      : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(EMPTY_CART);

  useEffect(() => {
    const load = () => setItems(parseStoredCart());
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const writeCart = (nextItems: CartItem[]) => {
    setItems(nextItems);
    window.localStorage.setItem(cartStorageKey, JSON.stringify(nextItems));
  };

  const addItem = (item: AddToCartPayload) => {
    const quantityToAdd = item.quantity ?? 1;
    const currentItems = items;
    const existing = currentItems.find((cartItem) => cartItem.slug === item.slug);
    const nextQuantity = Math.min(maxProductStock, (existing?.quantity || 0) + quantityToAdd);
    const nextItems = existing
      ? currentItems.map((cartItem) =>
          cartItem.slug === item.slug
            ? { ...cartItem, quantity: nextQuantity }
            : cartItem,
        )
      : [...currentItems, { ...item, quantity: Math.min(maxProductStock, Math.max(1, quantityToAdd)) }];

    writeCart(nextItems);
  };

  const updateQuantity = (slug: string, quantity: number) => {
    const nextItems = items
        .map((item) => (item.slug === slug ? { ...item, quantity: Math.min(maxProductStock, quantity) } : item))
        .filter((item) => item.quantity > 0);

    writeCart(nextItems);
  };

  const removeItem = (slug: string) => {
    writeCart(items.filter((item) => item.slug !== slug));
  };

  const clearCart = () => {
    writeCart(EMPTY_CART);
  };

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const total = useMemo(() => calculateCartTotals(items, 50).subtotal, [items]);

  return (
    <CartContext.Provider value={{ items, cartCount, total, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
