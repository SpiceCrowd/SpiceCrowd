import { shippingRates, type ShippingMethod } from "@/lib/promotionConfig";
import { calculateOrderTotal } from "@/lib/orderUtils";

export type Promotion = {
  id: string;
  title: string;
  kind: "discount" | "free_shipping";
  trigger: "automatic" | "coupon";
  code?: string;
  status: "active" | "paused" | "unavailable";
  valueType: "percent" | "flat";
  value: number;
  // Compared against the eligible subtotal; free shipping compares against the post-discount subtotal.
  minOrder: number;
  maxDiscount: number | null;
  appliesTo: { products?: string[]; categories?: string[] } | null;
  startsAt: string | null;
  endsAt: string | null;
  // 0 = unlimited. Only coupons (data/coupons.json) track usage.
  usageLimit: number;
  usedCount: number;
  perCustomerLimit: number;
  customer: "all" | "logged_in" | "first_order";
  // A discount only combines with another discount when both are stackable.
  stackable: boolean;
  shippingMethods: ShippingMethod[] | null;
  public: boolean;
};

export type QuoteLine = {
  slug: string;
  title: string;
  quantity: number;
  price: number;
  lineTotal: number;
  category?: string;
};

export type CustomerContext = {
  loggedIn: boolean;
  priorOrders: number;
  usesByCode: Record<string, number>;
};

export type AppliedPromotion = {
  id: string;
  title: string;
  code?: string;
  kind: "discount" | "free_shipping";
  amount: number;
};

export type CouponOutcome = {
  code: string;
  status: "applied" | "not_applied" | "rejected";
  title?: string;
  discount?: number;
  message?: string;
};

export type Nudge = { promotionId: string; title: string; remaining: number };

export type Quote = {
  subtotal: number;
  discount: number;
  promotions: AppliedPromotion[];
  coupon: CouponOutcome | null;
  shipping: { method: ShippingMethod; baseCost: number; cost: number; discount: number };
  tax: number;
  total: number;
  nudges: Nudge[];
};

type Eligibility = { eligible: true; amount: number } | { eligible: false; reason: string; shortfall?: number };

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export function normalizeCouponCode(code: unknown) {
  return typeof code === "string" ? code.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function parseBoundary(value: string, endOfDay: boolean) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`).getTime();
  return new Date(value).getTime();
}

// Checks status, schedule, usage limits and customer eligibility; returns a customer-facing reason when blocked.
function availabilityReason(promo: Promotion, customer: CustomerContext, now: Date): string | null {
  if (promo.status !== "active") return promo.trigger === "coupon" ? "This coupon is not available" : "This offer is not available";
  if (!Number.isFinite(promo.value) || promo.value <= 0 || (promo.valueType === "percent" && promo.value > 100)) {
    return "This offer is not configured correctly";
  }
  if (promo.startsAt) {
    const start = parseBoundary(promo.startsAt, false);
    if (!Number.isFinite(start) || start > now.getTime()) return "This offer has not started yet";
  }
  if (promo.endsAt) {
    const end = parseBoundary(promo.endsAt, true);
    if (!Number.isFinite(end) || end < now.getTime()) return promo.trigger === "coupon" ? "This coupon has expired" : "This offer has ended";
  }
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) return "This coupon has reached its usage limit";
  if (promo.customer !== "all" && !customer.loggedIn) return "Sign in to use this offer";
  if (promo.customer === "first_order" && customer.priorOrders > 0) return "This offer is valid on your first order only";
  if (promo.perCustomerLimit > 0 && promo.code && (customer.usesByCode[promo.code] ?? 0) >= promo.perCustomerLimit) {
    return "You have already used this coupon the maximum number of times";
  }
  return null;
}

function eligibleSubtotal(promo: Promotion, lines: QuoteLine[]) {
  const scope = promo.appliesTo;
  const products = scope?.products ?? [];
  const categories = scope?.categories ?? [];
  const matching = products.length || categories.length
    ? lines.filter((line) => products.includes(line.slug) || (line.category !== undefined && categories.includes(line.category)))
    : lines;
  return matching.reduce((sum, line) => sum + line.lineTotal, 0);
}

function evaluateDiscount(promo: Promotion, lines: QuoteLine[], customer: CustomerContext, now: Date): Eligibility {
  const blocked = availabilityReason(promo, customer, now);
  if (blocked) return { eligible: false, reason: blocked };

  const base = eligibleSubtotal(promo, lines);
  if (base <= 0) return { eligible: false, reason: "This offer does not apply to the items in your cart" };
  if (base < promo.minOrder) {
    const shortfall = promo.minOrder - base;
    return { eligible: false, reason: `Add items worth ${rupees(shortfall)} more to use this offer (minimum ${rupees(promo.minOrder)})`, shortfall };
  }

  const raw = promo.valueType === "percent" ? Math.round((base * promo.value) / 100) : Math.round(promo.value);
  const capped = promo.maxDiscount === null ? raw : Math.min(raw, promo.maxDiscount);
  const amount = Math.min(base, Math.max(0, capped));
  if (amount <= 0) return { eligible: false, reason: "This offer does not apply to this order" };
  return { eligible: true, amount };
}

export function computeQuote(input: {
  lines: QuoteLine[];
  promotions: Promotion[];
  couponCode?: unknown;
  shippingMethod: ShippingMethod;
  customer: CustomerContext;
  now?: Date;
  gstin?: string | null;
}): Quote {
  const { lines, promotions, customer, shippingMethod } = input;
  const now = input.now ?? new Date();
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const couponCode = normalizeCouponCode(input.couponCode);

  const coupon = couponCode ? promotions.find((p) => p.kind === "discount" && p.trigger === "coupon" && p.code === couponCode) : undefined;
  const candidates = promotions.filter((p) => p.kind === "discount" && (p.trigger === "automatic" || p === coupon));

  const eligible: Array<{ promo: Promotion; amount: number }> = [];
  const nudges: Nudge[] = [];
  let couponOutcome: CouponOutcome | null = null;
  if (couponCode && !coupon) couponOutcome = { code: couponCode, status: "rejected", message: "This coupon is not available" };

  for (const promo of candidates) {
    const result = evaluateDiscount(promo, lines, customer, now);
    if (result.eligible) eligible.push({ promo, amount: result.amount });
    else if (promo === coupon) couponOutcome = { code: couponCode, status: "rejected", message: result.reason };
    else if (result.shortfall) nudges.push({ promotionId: promo.id, title: promo.title, remaining: result.shortfall });
  }

  // Best discount first; automatic wins ties so no coupon use is consumed needlessly.
  const tieRank = (promo: Promotion) => (promo.trigger === "automatic" ? 0 : 1);
  eligible.sort((a, b) => b.amount - a.amount || tieRank(a.promo) - tieRank(b.promo));
  const applied: Array<{ promo: Promotion; amount: number }> = [];
  let running = 0;
  for (const entry of eligible) {
    const canStack = applied.length === 0 || (entry.promo.stackable && applied.every((a) => a.promo.stackable));
    const amount = Math.min(entry.amount, subtotal - running);
    if (canStack && amount > 0) {
      applied.push({ promo: entry.promo, amount });
      running += amount;
    }
  }
  const discount = running;

  if (coupon && couponOutcome === null) {
    const appliedCoupon = applied.find((a) => a.promo === coupon);
    couponOutcome = appliedCoupon
      ? { code: couponCode, status: "applied", title: coupon.title, discount: appliedCoupon.amount }
      : { code: couponCode, status: "not_applied", title: coupon.title, message: `${applied[0]?.promo.title ?? "Another offer"} already gives a bigger saving, and offers cannot be combined` };
  }

  const baseCost = shippingRates[shippingMethod];
  let shippingDiscount = 0;
  const shippingPromotions: AppliedPromotion[] = [];
  for (const promo of promotions.filter((p) => p.kind === "free_shipping" && p.trigger === "automatic")) {
    if (promo.shippingMethods && !promo.shippingMethods.includes(shippingMethod)) continue;
    if (availabilityReason(promo, customer, now)) continue;
    const scoped = promo.appliesTo && (promo.appliesTo.products?.length || promo.appliesTo.categories?.length);
    const merchandise = scoped ? eligibleSubtotal(promo, lines) : subtotal - discount;
    if (merchandise < promo.minOrder) {
      nudges.push({ promotionId: promo.id, title: promo.title, remaining: promo.minOrder - merchandise });
      continue;
    }
    const waived = Math.min(baseCost, Math.round((baseCost * promo.value) / 100));
    if (waived > shippingDiscount) {
      shippingDiscount = waived;
      shippingPromotions.splice(0, shippingPromotions.length, { id: promo.id, title: promo.title, kind: "free_shipping", amount: waived });
    }
  }

  const shippingCost = baseCost - shippingDiscount;
  const totals = calculateOrderTotal(subtotal, discount, input.gstin, shippingCost);

  return {
    subtotal,
    discount: totals.discount,
    promotions: [
      ...applied.map((a): AppliedPromotion => ({ id: a.promo.id, title: a.promo.title, code: a.promo.code, kind: "discount", amount: a.amount })),
      ...shippingPromotions,
    ],
    coupon: couponOutcome,
    shipping: { method: shippingMethod, baseCost, cost: shippingCost, discount: shippingDiscount },
    tax: totals.tax,
    total: totals.total,
    nudges: nudges.sort((a, b) => a.remaining - b.remaining),
  };
}

export type PromotionSummary = { id: string; title: string; headline: string; kind: Promotion["kind"]; code?: string; conditions: string[] };

function formatDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : new Date(value).toISOString().slice(0, 10);
}

function headlineFor(promo: Promotion, scoped: boolean) {
  const minimum = promo.minOrder > 0 ? ` of ${rupees(promo.minOrder)} or more` : "";
  if (promo.kind === "free_shipping") {
    return `Free ${promo.shippingMethods?.join(" or ") ?? ""} shipping on orders${minimum}`.replace(/\s+/g, " ");
  }
  const value = promo.valueType === "percent" ? `${promo.value}% off` : `${rupees(promo.value)} off`;
  return `${value} ${scoped ? "selected items" : "orders"}${minimum}`;
}

// Customer-facing eligibility text is generated from the rule itself so it cannot drift from what is enforced.
export function summarizePromotion(promo: Promotion): PromotionSummary {
  const conditions: string[] = [];
  const scoped = Boolean(promo.appliesTo && (promo.appliesTo.products?.length || promo.appliesTo.categories?.length));
  if (promo.code) conditions.push(`Use code ${promo.code}`);
  if (promo.kind === "discount") {
    conditions.push(promo.valueType === "percent" ? `${promo.value}% off${scoped ? " eligible items" : ""}` : `${rupees(promo.value)} off`);
    if (promo.maxDiscount !== null) conditions.push(`Maximum discount ${rupees(promo.maxDiscount)}`);
  } else {
    conditions.push(`Applies to ${promo.shippingMethods?.join(" / ") ?? "all"} shipping`);
  }
  if (promo.minOrder > 0) {
    conditions.push(`Minimum order ${rupees(promo.minOrder)}${promo.kind === "free_shipping" ? " after discounts" : scoped ? " on eligible items" : ""}`);
  }
  if (promo.appliesTo?.categories?.length) conditions.push(`Categories: ${promo.appliesTo.categories.join(", ")}`);
  if (promo.appliesTo?.products?.length) conditions.push("Selected products only");
  if (promo.startsAt && promo.endsAt) conditions.push(`Valid ${formatDate(promo.startsAt)} to ${formatDate(promo.endsAt)}`);
  else if (promo.endsAt) conditions.push(`Valid until ${formatDate(promo.endsAt)}`);
  else if (promo.startsAt) conditions.push(`Valid from ${formatDate(promo.startsAt)}`);
  if (promo.customer === "first_order") conditions.push("First order only (sign in required)");
  if (promo.customer === "logged_in") conditions.push("Sign in required");
  if (promo.usageLimit > 0) conditions.push("Limited redemptions");
  if (promo.kind === "discount") conditions.push(promo.stackable ? "Can be combined with other stackable offers" : "Cannot be combined with other discounts");
  return { id: promo.id, title: promo.title, headline: headlineFor(promo, scoped), kind: promo.kind, code: promo.code, conditions };
}

// An offer may only be advertised while it is live, public, in its date window and not exhausted.
export function isAdvertisable(promo: Promotion, now = new Date()) {
  if (!promo.public || promo.status !== "active" || !(promo.value > 0)) return false;
  if (promo.startsAt && !(parseBoundary(promo.startsAt, false) <= now.getTime())) return false;
  if (promo.endsAt && !(parseBoundary(promo.endsAt, true) >= now.getTime())) return false;
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) return false;
  return true;
}
