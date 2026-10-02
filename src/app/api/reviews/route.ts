import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const product = typeof body.product === "string" ? body.product.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : "";
  const rating = Number(body.rating);
  if (!product || !text || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: "product, rating from 1-5, and review text are required" }, { status: 400 });
  }
  const reviews = await readJson<any[]>("reviews.json", []);
  const entry = { id: `rev_${Date.now()}`, product, rating, text, createdAt: new Date().toISOString() };
  reviews.push(entry);
  await writeJson("reviews.json", reviews);
  return NextResponse.json({ success: true, review: entry });
}

export async function GET() {
  const reviews = await readJson<any[]>("reviews.json", []);
  return NextResponse.json({ success: true, reviews });
}
