import { readJson } from "@/lib/storage";
import { verifyToken } from "@/lib/auth";
import { priceOrderItems } from "@/lib/checkoutPricing";
import { builtInPromotions, type ShippingMethod } from "@/lib/promotionConfig";
import { computeQuote, normalizeCouponCode, type CustomerContext, type Promotion, type Quote } from "@/lib/promotions";

type StoredCoupon = {
  id?: string;
  code: string;
  title?: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number;
  usedCount: number;
  expiresAt: string | null;
  status: "active" | "paused";
  startsAt?: string | null;
  appliesTo?: Promotion["appliesTo"];
  customer?: Promotion["customer"];
  perCustomerLimit?: number;
  stackable?: boolean;
  public?: boolean;
};

type StoredOffer = {
  id: string;
  title: string;
  offerType: "percent" | "flat" | "bogo";
  value: number;
  minOrder: number;
  startAt: string;
  endAt: string;
  status: "active" | "draft" | "paused";
};

type StoredOrder = {
  coupon?: { code?: string } | null;
  status?: string;
  userId?: string | null;
  email?: string | null;
};

const validCustomerKinds = new Set<Promotion["customer"]>(["all", "logged_in", "first_order"]);

export function couponToPromotion(coupon: StoredCoupon): Promotion {
  return {
    id: coupon.id || `coupon-${coupon.code}`,
    title: coupon.title || coupon.code,
    kind: "discount",
    trigger: "coupon",
    code: normalizeCouponCode(coupon.code),
    status: coupon.status === "active" ? "active" : "paused",
    valueType: coupon.discountType,
    value: Number(coupon.discountValue),
    minOrder: Number(coupon.minOrder) || 0,
    maxDiscount: coupon.maxDiscount === null || coupon.maxDiscount === undefined ? null : Number(coupon.maxDiscount),
    appliesTo: coupon.appliesTo ?? null,
    startsAt: coupon.startsAt ?? null,
    endsAt: coupon.expiresAt,
    usageLimit: Number(coupon.usageLimit) || 0,
    usedCount: Number(coupon.usedCount) || 0,
    perCustomerLimit: Number(coupon.perCustomerLimit) || 0,
    customer: coupon.customer && validCustomerKinds.has(coupon.customer) ? coupon.customer : "all",
    stackable: coupon.stackable === true,
    shippingMethods: null,
    public: coupon.public === true,
  };
}

// BOGO offers have no calculation, so they are mapped as unavailable and never applied or advertised.
export function offerToPromotion(offer: StoredOffer): Promotion {
  const supported = offer.offerType === "percent" || offer.offerType === "flat";
  return {
    id: `offer-${offer.id}`,
    title: offer.title,
    kind: "discount",
    trigger: "automatic",
    status: supported ? (offer.status === "active" ? "active" : "paused") : "unavailable",
    valueType: offer.offerType === "flat" ? "flat" : "percent",
    value: Number(offer.value),
    minOrder: Number(offer.minOrder) || 0,
    maxDiscount: null,
    appliesTo: null,
    startsAt: offer.startAt || null,
    endsAt: offer.endAt || null,
    usageLimit: 0,
    usedCount: 0,
    perCustomerLimit: 0,
    customer: "all",
    stackable: false,
    shippingMethods: null,
    public: true,
  };
}

export async function loadPromotions(): Promise<Promotion[]> {
  const [coupons, offers] = await Promise.all([
    readJson<StoredCoupon[]>("coupons.json", []),
    readJson<StoredOffer[]>("offers.json", []),
  ]);
  return [
    ...builtInPromotions,
    ...(Array.isArray(offers) ? offers.map(offerToPromotion) : []),
    ...(Array.isArray(coupons) ? coupons.map(couponToPromotion) : []),
  ];
}

async function customerContext(auth: string | null): Promise<CustomerContext> {
  const payload = verifyToken(auth || undefined) as { sub?: string; uid?: string; email?: string } | null;
  const userId = payload?.sub || payload?.uid || null;
  const email = typeof payload?.email === "string" ? payload.email.toLowerCase() : null;
  if (!payload || (!userId && !email)) return { loggedIn: false, priorOrders: 0, usesByCode: {} };

  const orders = await readJson<StoredOrder[]>("orders.json", []);
  const mine = (Array.isArray(orders) ? orders : []).filter((order) =>
    (userId && order.userId === userId) || (email && order.email?.toLowerCase() === email));
  const counted = mine.filter((order) => order.status !== "payment_pending" && order.status !== "cancelled" && order.status !== "failed");
  const usesByCode: Record<string, number> = {};
  for (const order of counted) {
    const code = normalizeCouponCode(order.coupon?.code);
    if (code) usesByCode[code] = (usesByCode[code] ?? 0) + 1;
  }
  return { loggedIn: true, priorOrders: counted.length, usesByCode };
}

export function parseShippingMethod(value: unknown): ShippingMethod {
  return value === "express" ? "express" : "standard";
}

// Prices come from the catalogue and discounts from stored rules; nothing numeric from the client is trusted.
export async function buildQuote(input: {
  items: unknown;
  coupon?: unknown;
  shippingMethod?: unknown;
  gstin?: string | null;
  authorization: string | null;
}): Promise<{ ok: false; error: string } | { ok: true; items: NonNullable<ReturnType<typeof priceOrderItems>["items"]>; quote: Quote }> {
  const priced = priceOrderItems(input.items);
  if (priced.error || !priced.items) return { ok: false, error: priced.error || "Cart is invalid" };

  const [promotions, customer] = await Promise.all([loadPromotions(), customerContext(input.authorization)]);
  const quote = computeQuote({
    lines: priced.items,
    promotions,
    couponCode: input.coupon,
    shippingMethod: parseShippingMethod(input.shippingMethod),
    customer,
    gstin: input.gstin,
  });
  return { ok: true, items: priced.items, quote };
}
