import { NextResponse } from "next/server";

/**
 * Simple shipping calculator placeholder.
 * POST body may include { pincode, items }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pincode = (body?.pincode || "").toString();
  const carrier = (body?.carrier || "economy").toString();
  const carriers: Record<string, number> = { economy: 1.0, speedy: 1.35, pickup: 0 };
  const modifier = carriers[carrier] ?? 1.0;
  // Sample rule: pincodes starting with '6' are local -> 50, others -> 99
  const base = pincode.startsWith("6") ? 50 : 99;
  const cost = Math.round(base * modifier);
  return NextResponse.json({ success: true, pincode, carrier, cost, note: "carriers: economy,speedy,pickup - base 6xx=50 else 99" });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pincode = url.searchParams.get("pincode") || "";
  const carrier = url.searchParams.get('carrier') || 'economy';
  const carriers: Record<string, number> = { economy: 1.0, speedy: 1.35, pickup: 0 };
  const modifier = carriers[carrier] ?? 1.0;
  const cost = pincode.startsWith("6") ? 50 : 99;
  return NextResponse.json({ success: true, pincode, carrier, cost: Math.round(cost * modifier) });
}
