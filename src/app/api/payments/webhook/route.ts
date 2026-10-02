import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { isValidEmail, notifyEmail } from "@/lib/notifications";

export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const internalSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!stripeSecret && (!internalSecret || req.headers.get("x-webhook-secret") !== internalSecret)) {
    return NextResponse.json({ success: false, error: "webhook authentication required" }, { status: 401 });
  }

  // Verify Stripe signatures when configured; otherwise require the local internal secret above.
  if (stripeSecret) {
    try {
      const payload = await req.text();
      const sig = req.headers.get("stripe-signature") || undefined;
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2022-11-15" });
      const event = stripe.webhooks.constructEvent(payload, sig || "", stripeSecret);
      // Handle payment_intent.succeeded
      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object as any;
        const orderId = pi.metadata?.orderId;
        if (orderId) {
          const orders = await readJson<any[]>("orders.json", []);
          const order = orders.find((o) => o.id === orderId);
          const updated = orders.map((o) => (o.id === orderId ? { ...o, status: "paid" } : o));
          await writeJson("orders.json", updated);
          if (isValidEmail(order?.email)) await notifyEmail({ to: order.email, subject: `Payment received for order ${orderId}`, text: `Payment for Spice Crowd order ${orderId} was received successfully.`, key: `payment-received:${orderId}` });
        }
      }
      return NextResponse.json({ success: true, received: event.type });
    } catch (err) {
      console.error("Webhook verify failed", err);
      return NextResponse.json({ success: false, error: String(err) }, { status: 400 });
    }
  }

  // Dev fallback: parse JSON and update order if included
  const data = await req.json().catch(() => ({}));
  try {
    if (data?.event === "payment.captured" && data?.orderId) {
      const orders = await readJson<any[]>("orders.json", []);
      const order = orders.find((o) => o.id === data.orderId);
      const updated = orders.map((o) => (o.id === data.orderId ? { ...o, status: "paid" } : o));
      await writeJson("orders.json", updated);
      if (isValidEmail(order?.email)) await notifyEmail({ to: order.email, subject: `Payment received for order ${data.orderId}`, text: `Payment for Spice Crowd order ${data.orderId} was received successfully.`, key: `payment-received:${data.orderId}` });
    }
  } catch (err) {
    console.error("webhook dev update failed", err);
  }

  console.log("[webhook] dev mock received", data);
  return NextResponse.json({ success: true, received: data });
}
