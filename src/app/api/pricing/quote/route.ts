import { NextResponse } from "next/server";
import { buildQuote } from "@/lib/pricingService";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await buildQuote({
    items: body?.items,
    coupon: body?.coupon,
    shippingMethod: body?.shippingMethod,
    gstin: typeof body?.gstin === "string" ? body.gstin : null,
    authorization: req.headers.get("authorization"),
  });
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  return NextResponse.json({ success: true, quote: result.quote }, { headers: { "Cache-Control": "no-store" } });
}
