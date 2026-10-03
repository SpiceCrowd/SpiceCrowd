import { NextResponse } from "next/server";
import { readJson, updateJson } from "@/lib/storage";
import { buildQuote, parseShippingMethod } from "@/lib/pricingService";
import type { AppliedPromotion } from "@/lib/promotions";
import { verifyToken, isAdmin } from "@/lib/auth";
import { createDummyTracking } from "@/lib/tracking";
import { isValidEmail, notifyEmail } from "@/lib/notifications";
import { reserveInventory } from "@/lib/inventory";

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import("@/lib/db");
    return db.prisma;
  } catch {
    return null;
  }
}

type Order = {
  id: string;
  items: Array<{
    slug: string;
    variantId?: string;
    title?: string;
    quantity: number;
    price?: number;
    priceLabel?: string;
    lineTotal?: number;
  }>;
  subtotal?: number;
  discount?: number;
  coupon?: { code: string; title: string; discount: number } | null;
  promotions?: AppliedPromotion[];
  tax?: number;
  delivery?: number;
  total: number;
  status: string;
  fulfillmentStatus?: string;
  createdAt: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal?: string;
  };
  shipping?: {
    method?: string;
    cost?: number;
    baseCost?: number;
    discount?: number;
  };
  payment?: {
    provider?: string;
    paymentId?: string;
    method?: string;
    success?: boolean;
  };
  userId?: string | null;
  email?: string | null;
  tracking?: Record<string, unknown>;
};

async function upsertOrderSnapshot(order: Order) {
  await updateJson<Order[]>("orders.json", [], (orders) => {
    const existingIndex = orders.findIndex((item) => item.id === order.id);
    if (existingIndex >= 0) return orders.map((item, index) => index === existingIndex ? { ...item, ...order } : item);
    return [...orders, order];
  });
}

type UsageCoupon = { code: string; usageLimit: number; usedCount: number };

// Re-checks the limit inside the locked update so concurrent orders cannot exceed it.
async function changeCouponUsage(code: string, delta: 1 | -1) {
  let changed = false;
  await updateJson<UsageCoupon[]>("coupons.json", [], (coupons) => coupons.map((coupon) => {
    if (coupon.code.toUpperCase() !== code.toUpperCase()) return coupon;
    if (delta === 1) {
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return coupon;
      changed = true;
      return { ...coupon, usedCount: coupon.usedCount + 1 };
    }
    changed = true;
    return { ...coupon, usedCount: Math.max(0, coupon.usedCount - 1) };
  }));
  return changed;
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Order creation is unavailable until verified live payments are configured." },
      { status: 503 },
    );
  }

  let reservedCouponCode: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    const tokenPayload = verifyToken(auth || undefined) as any;
    const userId = tokenPayload?.sub || tokenPayload?.uid || null;
    const userEmail = tokenPayload?.email || null;

    const couponInput = typeof body.coupon === "string" ? body.coupon : body.coupon?.code;
    const gstin = body?.address?.gstin || body?.gstin || null;
    const shippingMethod = parseShippingMethod(body?.shipping?.method);
    // Discounts, shipping and totals are always recomputed here; client-sent amounts are ignored.
    const built = await buildQuote({ items: body.items, coupon: couponInput, shippingMethod, gstin, authorization: auth });
    if (!built.ok) return NextResponse.json({ success: false, error: built.error }, { status: 400 });
    const { items, quote } = built;
    if (quote.coupon?.status === "rejected") {
      return NextResponse.json({ success: false, error: quote.coupon.message || "Coupon is not available" }, { status: 422 });
    }
    const couponResult = quote.coupon?.status === "applied" ? quote.coupon : null;
    const couponSnapshot = couponResult ? { code: couponResult.code, title: couponResult.title || couponResult.code, discount: couponResult.discount || 0 } : null;
    const calc = { subtotal: quote.subtotal, discount: quote.discount, tax: quote.tax, delivery: quote.shipping.cost, total: quote.total };
    const shippingSnapshot = { method: shippingMethod, cost: quote.shipping.cost, baseCost: quote.shipping.baseCost, discount: quote.shipping.discount };

    // Payment and inventory are verified before an order is confirmed.
    const prisma = await getPrisma();
    const inventoryItems = items.map((it: { slug: string; quantity: number }) => ({ slug: it.slug, quantity: Number(it.quantity ?? 1) }));

    const paymentId = typeof body?.payment?.paymentId === "string" ? body.payment.paymentId : "";
    const paymentSuccessful = Boolean(body?.payment?.success);
    const storedPayments = await readJson<Array<{ paymentId: string; amount: number; status: string }>>("payments.json", []);
    const existingOrderSnapshots = await readJson<Order[]>("orders.json", []);
    const existingPaymentOrder = paymentId ? existingOrderSnapshots.find((order) => order.payment?.paymentId === paymentId) : null;
    if (existingPaymentOrder) return NextResponse.json({ success: true, idempotent: true, orderId: existingPaymentOrder.id, order: existingPaymentOrder });
    if (paymentSuccessful) {
      const verifiedPayment = storedPayments.find((payment) => payment.paymentId === paymentId && payment.status === "succeeded" && payment.amount === calc.total);
      if (!verifiedPayment) return NextResponse.json({ success: false, error: "payment confirmation could not be verified" }, { status: 402 });
    }
    const inventoryReserved = paymentSuccessful && inventoryItems.length ? await reserveInventory(inventoryItems) : { reserved: false, error: null };
    if (paymentSuccessful && inventoryItems.length && !inventoryReserved.reserved) {
      return NextResponse.json({ success: false, error: inventoryReserved.error || "inventory unavailable" }, { status: 400 });
    }
    if (paymentSuccessful && couponResult) {
      if (!await changeCouponUsage(couponResult.code, 1)) {
        return NextResponse.json({ success: false, error: "This coupon has reached its usage limit" }, { status: 409 });
      }
      reservedCouponCode = couponResult.code;
    }
    const orderStatus = paymentSuccessful ? "paid" : "payment_pending";
    const fulfillmentStatus = paymentSuccessful ? "processing" : "awaiting_payment";

    if (prisma) {
      const order = await prisma.order.create({
        data: {
          total: calc.total,
          status: orderStatus,
        },
      });

      const snapshot: Order = {
        id: order.id,
        items,
        subtotal: calc.subtotal,
        discount: calc.discount,
        coupon: couponSnapshot,
        promotions: quote.promotions,
        tax: calc.tax,
        delivery: calc.delivery,
        total: calc.total,
        status: order.status || orderStatus,
        fulfillmentStatus,
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
        customer: {
          name: body?.customer?.name || "",
          phone: body?.customer?.phone || "",
          address: body?.customer?.address || "",
          city: body?.customer?.city || "",
          postal: body?.customer?.postal || "",
        },
        shipping: shippingSnapshot,
        payment: {
          provider: body?.payment?.provider || "mock",
          paymentId: body?.payment?.paymentId || null,
          method: body?.payment?.method || "card",
          success: paymentSuccessful,
        },
        userId,
        email: userEmail || body?.email || body?.customer?.email || null,
        tracking: createDummyTracking(order.id),
      };
      await upsertOrderSnapshot(snapshot);
      reservedCouponCode = null;

      const confirmationEmail = userEmail || body?.email || body?.customer?.email;
      if (isValidEmail(confirmationEmail)) await notifyEmail({ to: confirmationEmail, subject: `Order ${order.id} confirmation`, text: `Your Spice Crowd order ${order.id} was received. Total: INR ${calc.total}.`, key: `order-confirmation:${order.id}` });

      return NextResponse.json({ success: true, orderId: order.id, order: snapshot });
    }

    // File-based fallback
    const orderId = `ORDER_${Date.now()}`;
    const tracking = createDummyTracking(orderId);
    const order: Order = {
      id: orderId,
      items,
      subtotal: calc.subtotal,
      discount: calc.discount,
      coupon: couponSnapshot,
      promotions: quote.promotions,
      tax: calc.tax,
      delivery: calc.delivery,
      total: calc.total,
      status: orderStatus,
      fulfillmentStatus,
      createdAt: new Date().toISOString(),
      customer: {
        name: body?.customer?.name || "",
        phone: body?.customer?.phone || "",
        address: body?.customer?.address || "",
        city: body?.customer?.city || "",
        postal: body?.customer?.postal || "",
      },
      shipping: shippingSnapshot,
      payment: {
        provider: body?.payment?.provider || "mock",
        paymentId: body?.payment?.paymentId || null,
        method: body?.payment?.method || "card",
        success: paymentSuccessful,
      },
      userId: userId,
      email: userEmail || body?.email || body?.customer?.email || null,
      tracking,
    };

    await updateJson<Order[]>("orders.json", [], (orders) => [...orders, order]);
    reservedCouponCode = null;

    const confirmationEmail = userEmail || body?.email || body?.customer?.email;
    if (isValidEmail(confirmationEmail)) await notifyEmail({ to: confirmationEmail, subject: `Order ${orderId} confirmation`, text: `Your Spice Crowd order ${orderId} was received. Total: INR ${calc.total}.`, key: `order-confirmation:${orderId}` });

    return NextResponse.json({ success: true, orderId, order, discount: calc.discount, delivery: calc.delivery, tax: calc.tax });
  } catch (err) {
    if (reservedCouponCode) await changeCouponUsage(reservedCouponCode, -1).catch(() => false);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    const tokenPayload = verifyToken(auth || undefined) as any;
    const userId = tokenPayload?.sub || tokenPayload?.uid || null;
    const admin = isAdmin(auth || undefined);
    if (!tokenPayload) {
      return NextResponse.json({ success: false, error: "authentication required" }, { status: 401 });
    }

    const prisma = await getPrisma();
    if (prisma) {
      if (admin) {
        const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
        return NextResponse.json({ success: true, orders });
      }
      const snapshots = await readJson<Order[]>("orders.json", []);
      const my = snapshots.filter((order) => order.userId === userId || order.email === tokenPayload?.email);
      return NextResponse.json({ success: true, orders: admin ? await prisma.order.findMany({ orderBy: { createdAt: 'desc' } }) : my.map((order) => ({ ...order, tracking: order.tracking || createDummyTracking(order.id) })) });
    }

    const orders = await readJson<Order[]>("orders.json", []);
    if (admin) return NextResponse.json({ success: true, orders });
    if (userId) {
      const my = orders.filter((o) => o.userId === userId || o.email === tokenPayload?.email);
      return NextResponse.json({ success: true, orders: my.map((order) => ({ ...order, tracking: order.tracking || createDummyTracking(order.id) })) });
    }
    return NextResponse.json({ success: true, orders });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
