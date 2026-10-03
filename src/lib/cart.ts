export type CartItem = {
  slug: string;
  variantId?: string;
  title: string;
  price: number;
  priceLabel: string;
  quantity: number;
};

export type AddToCartPayload = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

export function cartLineKey(item: Pick<CartItem, "slug" | "variantId">) {
  return `${item.slug}::${item.variantId || "default"}`;
}

export type CartTotals = {
  subtotal: number;
  itemCount: number;
  shipping: number;
  total: number;
};

export function parsePrice(price: string) {
  return Number(price.replace(/[^0-9.-]/g, "")) || 0;
}

export function calculateCartTotals(items: CartItem[], shipping = 50): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = subtotal + shipping;

  return { subtotal, itemCount, shipping, total };
}

export function formatCurrency(amount: number) {
  return `₹${amount.toFixed(0)}`;
}

export const cartStorageKey = "spicecrowd-cart";
export const couponStorageKey = "spicecrowd-coupon";
export const maxProductStock = 10;
