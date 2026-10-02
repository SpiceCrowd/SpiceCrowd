import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { restoreOrderInventory } from "@/lib/inventory";
import { isValidEmail, notifyEmail } from "@/lib/notifications";

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import("@/lib/db");
    return db.prisma;
  } catch {
    return null;
  }
}

const allowedStatuses = new Set(["payment_pending", "paid", "processing", "packed", "dispatched", "shipped", "delivered", "cancelled", "refunded"]);
const allowedTransitions: Record<string, Set<string>> = {
  created: new Set(["created", "payment_pending", "paid", "cancelled"]),
  payment_pending: new Set(["payment_pending", "paid", "cancelled"]),
  paid: new Set(["paid", "processing", "cancelled", "refunded"]),
  processing: new Set(["processing", "packed", "cancelled", "refunded"]),
  packed: new Set(["packed", "dispatched", "cancelled"]),
  dispatched: new Set(["dispatched", "shipped", "delivered", "cancelled"]),
  shipped: new Set(["shipped", "delivered", "cancelled"]),
  delivered: new Set(["delivered", "refunded"]),
  cancelled: new Set(["cancelled"]),
  refunded: new Set(["refunded"]),
};

export async function POST(req: Request) {
  if (!isAdmin(req.headers.get("authorization") || req.headers.get("Authorization"))) {
    return NextResponse.json({ success: false, error: "admin required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const orderId = body?.orderId;
  const status = body?.status || "paid";
  if (!orderId) return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 });
  if (!allowedStatuses.has(status)) return NextResponse.json({ success: false, error: "invalid status" }, { status: 400 });
  const orders = await readJson<any[]>("orders.json", []);
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return NextResponse.json({ success: false, error: "order not found" }, { status: 404 });
  const currentStatus = String(orders[index].status || "created");
  if (!allowedTransitions[currentStatus]?.has(status)) {
    return NextResponse.json({ success: false, error: `invalid transition from ${currentStatus} to ${status}` }, { status: 409 });
  }
  const order = { ...orders[index], status };
  if (status === "cancelled" || status === "refunded") await restoreOrderInventory(order);
  orders[index] = order;
  await writeJson("orders.json", orders);
  const prisma = await getPrisma();
  if (prisma) await prisma.order.updateMany({ where: { id: orderId } as any, data: { status } as any } as any);
  if ((status === "cancelled" || status === "refunded") && isValidEmail(order.email)) {
    await notifyEmail({ to: order.email, subject: `Order ${orderId} ${status}`, text: `Your Spice Crowd order ${orderId} is now ${status}.`, key: `order-status:${orderId}:${status}` });
  }
  return NextResponse.json({ success: true, orderId, status });
}
