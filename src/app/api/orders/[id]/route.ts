import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { verifyToken, isAdmin } from "@/lib/auth";
import { createDummyTracking, courierOptions, trackingStatuses, type DummyCourier } from "@/lib/tracking";
import { isValidEmail, notifyEmail } from "@/lib/notifications";
import { promises as fs } from "fs";
import path from "path";

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import("@/lib/db");
    return db.prisma;
  } catch {
    return null;
  }
}

async function readFileOrdersSnapshot() {
  try {
    const file = path.join(process.cwd(), "data", "orders.json");
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = auth || undefined;
    const payload: any = verifyToken(token);
    const userId = payload?.sub || payload?.uid || null;
    const admin = isAdmin(token);
    const guestEmail = new URL(req.url).searchParams.get('email')?.trim().toLowerCase();

    const snapshots = await readJson<any[]>("orders.json", []);
    let snapshot = snapshots.find((o) => String(o.id) === String(id));
    if (!snapshot) {
      const fileSnapshots = await readFileOrdersSnapshot();
      snapshot = fileSnapshots.find((o) => String(o.id) === String(id));
    }

    const prisma = await getPrisma();
    if (prisma) {
      const order = await prisma.order.findUnique({ where: { id: id as any } as any });

      if (!order && !snapshot) return NextResponse.json({ success: false, error: 'not found' }, { status: 404 });

      const merged = order
        ? {
            ...snapshot,
            ...order,
            items: snapshot?.items || [],
            customer: snapshot?.customer,
            payment: snapshot?.payment,
            shipping: snapshot?.shipping,
            subtotal: snapshot?.subtotal,
            discount: snapshot?.discount,
            tax: snapshot?.tax,
            delivery: snapshot?.delivery,
          }
        : snapshot;

      const guestAllowed = Boolean(guestEmail && merged?.email && String(merged.email).toLowerCase() === guestEmail);
      if (!admin && merged?.userId && String(merged.userId) !== String(userId) && !guestAllowed) {
        return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });
      }

      return NextResponse.json({ success: true, order: merged });
    }

    const order = snapshot;
    if (!order) return NextResponse.json({ success: false, error: 'not found' }, { status: 404 });
    const guestAllowed = Boolean(guestEmail && order.email && String(order.email).toLowerCase() === guestEmail);
    if (!admin && order.userId && String(order.userId) !== String(userId) && !guestAllowed) {
      return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!isAdmin(auth)) return NextResponse.json({ success: false, error: "admin required" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const courier = body.courier as DummyCourier | undefined;
  const status = body.status;
  if (courier && !courierOptions.some((option) => option.name === courier)) return NextResponse.json({ success: false, error: "invalid courier" }, { status: 400 });
  if (status && !trackingStatuses.includes(status)) return NextResponse.json({ success: false, error: "invalid tracking status" }, { status: 400 });
  const orders = await readJson<any[]>("orders.json", []);
  const index = orders.findIndex((order) => String(order.id) === String(id));
  if (index < 0) return NextResponse.json({ success: false, error: "order not found" }, { status: 404 });
  const current = orders[index].tracking || createDummyTracking(id);
  const nextCourier = courier || current.courier || "ST Courier";
  const nextStatus = status || current.status || "order_confirmed";
  const tracking = courier && courier !== current.courier
    ? { ...createDummyTracking(id, nextCourier), status: nextStatus, collectionAddress: body.collectionAddress ?? current.collectionAddress ?? "" }
    : { ...current, courier: nextCourier, status: nextStatus, collectionAddress: body.collectionAddress ?? current.collectionAddress ?? "" };
  const events = Array.isArray(current.events) ? current.events : [];
  if (!events.some((event: { status?: string }) => event.status === nextStatus)) tracking.events = [...events, { status: nextStatus, at: new Date().toISOString() }];
  orders[index] = { ...orders[index], tracking };
  await writeJson("orders.json", orders);
  if (nextStatus !== current.status && isValidEmail(orders[index].email)) {
    await notifyEmail({ to: orders[index].email, subject: `Shipping update for order ${id}`, text: `Order ${id} status: ${nextStatus}. Tracking number: ${tracking.trackingNumber || "pending"}.`, key: `shipping-update:${id}:${nextStatus}` });
  }
  return NextResponse.json({ success: true, order: orders[index] });
}
