import type { Promotion } from "@/lib/promotions";

// Single source of truth for built-in promotions and shipping rates.
// Coupons (data/coupons.json) and admin offers (data/offers.json) are merged in by the server (see pricingService.ts).

export const shippingRates = { standard: 50, express: 150 } as const;
export type ShippingMethod = keyof typeof shippingRates;

export const builtInPromotions: Promotion[] = [
  {
    id: "auto-10-off-999",
    title: "10% off orders of ₹999 or more",
    kind: "discount",
    trigger: "automatic",
    status: "active",
    valueType: "percent",
    value: 10,
    minOrder: 999,
    maxDiscount: 500,
    appliesTo: null,
    startsAt: null,
    endsAt: null,
    usageLimit: 0,
    usedCount: 0,
    perCustomerLimit: 0,
    customer: "all",
    stackable: false,
    shippingMethods: null,
    public: true,
  },
  {
    id: "auto-free-shipping-500",
    title: "Free standard shipping on orders of ₹500 or more",
    kind: "free_shipping",
    trigger: "automatic",
    status: "active",
    valueType: "percent",
    value: 100,
    minOrder: 500,
    maxDiscount: null,
    appliesTo: null,
    startsAt: null,
    endsAt: null,
    usageLimit: 0,
    usedCount: 0,
    perCustomerLimit: 0,
    customer: "all",
    stackable: true,
    shippingMethods: ["standard"],
    public: true,
  },
];

// Previously advertised but never implemented in cart/checkout. They must not be shown as live.
export const unavailablePromotions = [
  { id: "legacy-30-off-1000", advertisedAs: "30% OFF eligibility above ₹1,000", reason: "No calculation exists" },
  { id: "legacy-40-off-10000", advertisedAs: "40% OFF eligibility above ₹10,000", reason: "No calculation exists" },
  { id: "legacy-20-off-combo", advertisedAs: "20% OFF selected combo packs", reason: "Combo packs are not orderable and have no discount logic" },
  { id: "legacy-40-off-yearly", advertisedAs: "40% OFF selected yearly packs", reason: "Yearly packs are not orderable and have no discount logic" },
  { id: "legacy-bundle-15", advertisedAs: "Bundle discounts up to 15%", reason: "Bundle items are added at regular prices" },
  { id: "legacy-sale-badge-15", advertisedAs: "15% OFF sale badge", reason: "Badge was not tied to any rule" },
] as const;
