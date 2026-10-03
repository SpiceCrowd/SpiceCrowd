"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CartItem } from "@/lib/cart";
import type { ShippingMethod } from "@/lib/promotionConfig";
import type { PromotionSummary, Quote } from "@/lib/promotions";

type Settled = { key: string; quote: Quote | null; error: string | null };

export async function fetchQuote(
  items: Array<Pick<CartItem, "slug" | "variantId" | "quantity">>,
  shippingMethod: ShippingMethod,
  coupon: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<{ quote: Quote | null; error: string | null }> {
  try {
    const response = await fetch("/api/pricing/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ items, shippingMethod, coupon: coupon || undefined }),
      signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) return { quote: null, error: data.error || "Pricing is unavailable right now" };
    return { quote: data.quote as Quote, error: null };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { quote: null, error: "Pricing is unavailable right now" };
  }
}

// Every cart, shipping, coupon or login change re-prices on the server; the client never computes discounts.
export function useQuote(items: CartItem[], shippingMethod: ShippingMethod, couponCode: string) {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const [state, setState] = useState<Settled>({ key: "", quote: null, error: null });
  const [refreshCount, setRefreshCount] = useState(0);

  const key = JSON.stringify({
    lines: items.map((item) => [item.slug, item.variantId ?? "", item.quantity]),
    shippingMethod,
    couponCode,
    token,
    refreshCount,
  });
  const hasItems = items.length > 0;

  useEffect(() => {
    if (!hasItems) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const lines = JSON.parse(key).lines as Array<[string, string, number]>;
        const result = await fetchQuote(
          lines.map(([slug, variantId, quantity]) => ({ slug, variantId: variantId || undefined, quantity })),
          shippingMethod,
          couponCode,
          token,
          controller.signal,
        );
        setState({ key, ...result });
      } catch {
        // Aborted by a newer request.
      }
    }, 150);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [key, hasItems, shippingMethod, couponCode, token]);

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), []);
  const settled = state.key === key;
  return {
    quote: hasItems ? state.quote : null,
    error: hasItems && settled ? state.error : null,
    loading: hasItems && !settled,
    refresh,
  };
}

const fallbackSummaries: PromotionSummary[] = [];

// Live, advertisable promotions straight from the same engine that prices orders.
export function usePromotions() {
  const [promotions, setPromotions] = useState<PromotionSummary[]>(fallbackSummaries);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/promotions")
      .then((response) => response.json())
      .then((data) => { if (active && Array.isArray(data.promotions)) setPromotions(data.promotions); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  return { promotions, loaded };
}
