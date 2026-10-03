"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AddToCartPayload, CartItem } from "@/lib/cart";
import { calculateCartTotals, cartLineKey, cartStorageKey, maxProductStock } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  total: number;
  addItem: (item: AddToCartPayload) => void;
  updateQuantity: (slug: string, quantity: number, variantId?: string) => void;
  removeItem: (slug: string, variantId?: string) => void;
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
  // Mutations read this so several calls in the same tick build on each other.
  const itemsRef = useRef<CartItem[]>(EMPTY_CART);

  useEffect(() => {
    const load = () => {
      const stored = parseStoredCart();
      itemsRef.current = stored;
      setItems(stored);
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const writeCart = (nextItems: CartItem[]) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
    window.localStorage.setItem(cartStorageKey, JSON.stringify(nextItems));
  };

  const addItem = (item: AddToCartPayload) => {
    const quantityToAdd = item.quantity ?? 1;
    const currentItems = itemsRef.current;
    const itemKey = cartLineKey(item);
    const existing = currentItems.find((cartItem) => cartLineKey(cartItem) === itemKey);
    const nextQuantity = Math.min(maxProductStock, (existing?.quantity || 0) + quantityToAdd);
    const nextItems = existing
      ? currentItems.map((cartItem) =>
          cartLineKey(cartItem) === itemKey
            ? { ...cartItem, quantity: nextQuantity }
            : cartItem,
        )
      : [...currentItems, { ...item, quantity: Math.min(maxProductStock, Math.max(1, quantityToAdd)) }];

    writeCart(nextItems);
  };

  const updateQuantity = (slug: string, quantity: number, variantId?: string) => {
    const nextItems = itemsRef.current
        .map((item) => (item.slug === slug && item.variantId === variantId ? { ...item, quantity: Math.min(maxProductStock, quantity) } : item))
        .filter((item) => item.quantity > 0);

    writeCart(nextItems);
  };

  const removeItem = (slug: string, variantId?: string) => {
    writeCart(itemsRef.current.filter((item) => item.slug !== slug || item.variantId !== variantId));
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
