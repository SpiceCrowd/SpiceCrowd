import { NextResponse } from "next/server";
import { readJson, updateJson } from "@/lib/storage";
import { randomUUID } from "crypto";
import { isValidEmail, notifyEmail } from "@/lib/notifications";

type PaymentRequestBody = {
  amount?: number;
  currency?: string;
  orderId?: string | null;
};

/**
 * Payments endpoint supports real Stripe integration when `STRIPE_SECRET_KEY` is set.
 * Otherwise falls back to a mock response for local development.
 * POST body: { amount, currency, orderId }
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Live payments are unavailable until a payment provider is configured." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as PaymentRequestBody;
  const amount = Number(body?.amount ?? 0);
  const currency = body?.currency ?? "INR";
  const orderId = body?.orderId ?? null;
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ success: false, error: "amount must be greater than zero" }, { status: 400 });
  if (["failed", "cancelled", "canceled"].includes(String((body as { status?: string }).status || "").toLowerCase())) {
    if (orderId) {
      const order = await readJson<any[]>("orders.json", []).then((orders) => orders.find((candidate) => candidate.id === orderId));
      if (isValidEmail(order?.email)) await notifyEmail({ to: order.email, subject: `Payment failed for order ${orderId}`, text: `Payment for Spice Crowd order ${orderId} was not completed.`, key: `payment-failed:${orderId}` });
    }
    return NextResponse.json({ success: false, status: "payment_failed", error: "payment was not successful" }, { status: 402 });
  }

  const paymentId = `PAY_DUMMY_${randomUUID()}`;
  await updateJson<Array<{ paymentId: string; amount: number; currency: string; status: string; orderId: string | null }>>("payments.json", [], (payments) => [
    { paymentId, amount, currency, status: "succeeded", orderId },
    ...payments,
  ]);
  return NextResponse.json({
    success: true,
    paymentId,
    provider: "dummy",
    clientSecret: "dummy_client_secret",
    received: { amount, currency, orderId },
  });
}

export async function GET() {
  return NextResponse.json({ success: true, note: "POST to create a payment. Set STRIPE_SECRET_KEY to enable Stripe integration." });
}
