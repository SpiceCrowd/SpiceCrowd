import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = body?.code?.toUpperCase?.() ?? "";
  // Simple mock: accept SPICE10 for 10% off, FIRST20 for 20%
  if (code === "SPICE10") return NextResponse.json({ valid: true, discountPercent: 10 });
  if (code === "FIRST20") return NextResponse.json({ valid: true, discountPercent: 20 });
  return NextResponse.json({ valid: false, error: "Invalid coupon" }, { status: 404 });
}
