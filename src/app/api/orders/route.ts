import { NextResponse } from "next/server";
import { readJson, updateJson } from "@/lib/storage";
import { calculateOrderTotal } from "@/lib/orderUtils";
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

function parseMoney(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.]/g, "").trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Order creation is unavailable until verified live payments are configured." },
      { status: 503 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    const tokenPayload = verifyToken(auth || undefined) as any;
    const userId = tokenPayload?.sub || tokenPayload?.uid || null;
    const userEmail = tokenPayload?.email || null;

    const items = Array.isArray(body.items)
      ? body.items.map((it: any) => {
          const quantity = Math.max(1, Number(it?.quantity ?? 1));
          const unitPrice = parseMoney(it?.price ?? it?.priceLabel);
          return {
            slug: String(it?.slug || ""),
            variantId: typeof it?.variantId === "string" ? it.variantId : undefined,
            title: typeof it?.title === "string" ? it.title : String(it?.slug || "Item"),
            quantity,
            price: unitPrice,
            priceLabel: typeof it?.priceLabel === "string" ? it.priceLabel : undefined,
            gstPercent: typeof it?.gstPercent === "number" ? it.gstPercent : undefined,
            lineTotal: unitPrice * quantity,
          };
        })
      : [];

    const computedSubtotal = items.reduce((sum: number, item: { lineTotal?: number }) => sum + (item.lineTotal || 0), 0);
    const subtotal = computedSubtotal > 0 ? computedSubtotal : Number(body.total || 0);
    const gstin = body?.address?.gstin || body?.gstin || null;
    const delivery = Number(body?.shipping?.cost ?? body.delivery ?? 50);
    const configuredTaxRates = items.map((item: { gstPercent?: number }) => item.gstPercent).filter((rate: number | undefined): rate is number => typeof rate === "number" && rate >= 0);
    const configuredTaxRate = configuredTaxRates.length ? configuredTaxRates.reduce((sum: number, rate: number) => sum + rate, 0) / configuredTaxRates.length : undefined;
    const calc = calculateOrderTotal(subtotal, body.coupon, gstin, delivery, configuredTaxRate);

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
        shipping: {
          method: body?.shipping?.method || "standard",
          cost: Number(body?.shipping?.cost ?? calc.delivery),
        },
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
      shipping: {
        method: body?.shipping?.method || "standard",
        cost: Number(body?.shipping?.cost ?? calc.delivery),
      },
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

    const confirmationEmail = userEmail || body?.email || body?.customer?.email;
    if (isValidEmail(confirmationEmail)) await notifyEmail({ to: confirmationEmail, subject: `Order ${orderId} confirmation`, text: `Your Spice Crowd order ${orderId} was received. Total: INR ${calc.total}.`, key: `order-confirmation:${orderId}` });

    return NextResponse.json({ success: true, orderId, order, discount: calc.discount, delivery: calc.delivery, tax: calc.tax });
  } catch (err) {
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
