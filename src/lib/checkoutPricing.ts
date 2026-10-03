import { maxProductStock, parsePrice } from "@/lib/cart";
import { getProduct, inferProductCategory } from "@/lib/products";

export type PricedOrderItem = {
  slug: string;
  variantId?: string;
  title: string;
  quantity: number;
  price: number;
  priceLabel: string;
  lineTotal: number;
  category: string;
};

export function priceOrderItems(input: unknown): { items?: PricedOrderItem[]; subtotal?: number; error?: string } {
  if (!Array.isArray(input) || input.length === 0) return { error: "Your cart is empty" };

  const items: PricedOrderItem[] = [];
  for (const rawItem of input) {
    const item = rawItem as Record<string, unknown>;
    const slug = typeof item.slug === "string" ? item.slug : "";
    const product = getProduct(slug);
    if (!product) return { error: `Product ${slug || "in cart"} is unavailable` };

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxProductStock) {
      return { error: `Quantity for ${product.title} is invalid` };
    }

    const variantId = typeof item.variantId === "string" ? item.variantId : undefined;
    const variant = variantId
      ? product.sizeOptions.find((option) => option.sku === variantId || option.label === variantId)
      : undefined;
    if (variantId && !variant) return { error: `Selected size for ${product.title} is unavailable` };

    const available = variant?.stock ?? product.stock ?? maxProductStock;
    if (quantity > available) return { error: `Only ${available} of ${product.title} are available` };

    const priceLabel = variant?.price ?? product.price;
    const price = parsePrice(priceLabel);
    items.push({
      slug,
      variantId: variant?.sku,
      title: `${product.title}${variant ? ` (${variant.label})` : ""}`,
      quantity,
      price,
      priceLabel,
      lineTotal: price * quantity,
      category: product.category || inferProductCategory(product),
    });
  }

  return { items, subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0) };
}
