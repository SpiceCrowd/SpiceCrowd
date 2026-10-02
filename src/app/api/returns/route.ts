import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { isAdmin, verifyToken } from "@/lib/auth";
import { restoreOrderInventory } from "@/lib/inventory";
import { isValidEmail, notifyEmail } from "@/lib/notifications";

export type ReturnRequest = {
  id: string;
  orderId: string;
  email: string;
  reason: string;
  details: string;
  status: "requested" | "approved" | "rejected" | "refunded";
  createdAt: string;
  inventoryRestoredAt?: string;
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 1000) : "";

  if (!orderId || !email || !reason) {
    return NextResponse.json({ success: false, error: "orderId, email and reason are required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: "valid email required" }, { status: 400 });
  }

  const orders = await readJson<any[]>("orders.json", []);
  const order = orders.find((candidate) => candidate.id === orderId);
  if (!order) return NextResponse.json({ success: false, error: "order not found" }, { status: 404 });
  if (!order.email || String(order.email).toLowerCase() !== email) {
    return NextResponse.json({ success: false, error: "order email does not match" }, { status: 403 });
  }

  const requests = await readJson<ReturnRequest[]>("returns.json", []);
  const duplicate = requests.find((request) => request.orderId === orderId && request.email === email && request.status === "requested");
  if (duplicate) {
    return NextResponse.json({ success: false, error: "A return request already exists for this order" }, { status: 409 });
  }

  const request: ReturnRequest = {
    id: `RET_${Date.now()}`,
    orderId,
    email,
    reason,
    details,
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  requests.unshift(request);
  await writeJson("returns.json", requests);
  return NextResponse.json({ success: true, request });
}

export async function GET(req: Request) {
  const requests = await readJson<ReturnRequest[]>("returns.json", []);
  const authorization = req.headers.get("authorization");
  if (isAdmin(authorization)) return NextResponse.json({ success: true, requests });
  const payload = verifyToken(authorization);
  const orderId = new URL(req.url).searchParams.get("orderId");
  if (!payload?.email || !orderId) return NextResponse.json({ success: false, error: "authentication and order id are required" }, { status: 403 });
  const owned = requests.filter((request) => request.orderId === orderId && request.email === payload.email);
  return NextResponse.json({ success: true, requests: owned });
}

export async function PATCH(req: Request) {
  if (!isAdmin(req.headers.get("authorization"))) {
    return NextResponse.json({ success: false, error: "admin required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const status = body.status;
  if (!id || !["requested", "approved", "rejected", "refunded"].includes(status)) {
    return NextResponse.json({ success: false, error: "valid id and status are required" }, { status: 400 });
  }
  const requests = await readJson<ReturnRequest[]>("returns.json", []);
  const index = requests.findIndex((request) => request.id === id);
  if (index < 0) {
    return NextResponse.json({ success: false, error: "return request not found" }, { status: 404 });
  }
  const updatedRequest = { ...requests[index], status };
  if (status === "refunded") {
    const orders = await readJson<any[]>("orders.json", []);
    const orderIndex = orders.findIndex((order) => order.id === updatedRequest.orderId);
    if (orderIndex < 0) return NextResponse.json({ success: false, error: "order not found" }, { status: 404 });
    const order = { ...orders[orderIndex], status: "refunded" };
    const restored = await restoreOrderInventory(order);
    if (restored) updatedRequest.inventoryRestoredAt = order.inventoryRestoredAt;
    orders[orderIndex] = order;
    await writeJson("orders.json", orders);
  }
  const updated = [...requests];
  updated[index] = updatedRequest;
  await writeJson("returns.json", updated);
  if (isValidEmail(updatedRequest.email)) {
    await notifyEmail({ to: updatedRequest.email, subject: `Return request ${updatedRequest.status} for order ${updatedRequest.orderId}`, text: `Your return request for order ${updatedRequest.orderId} is now ${updatedRequest.status}.`, key: `return-status:${updatedRequest.id}:${updatedRequest.status}` });
  }
  return NextResponse.json({ success: true, request: updatedRequest });
}
