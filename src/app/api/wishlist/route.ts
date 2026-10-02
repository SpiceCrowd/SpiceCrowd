import { NextResponse } from "next/server";

import { readJson, writeJson } from "@/lib/storage";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const items = await readJson<any[]>("wishlist.json", []);
  const slug = body?.slug;
  if (!slug) return NextResponse.json({ success: false, error: "slug required" }, { status: 400 });
  const exists = items.find((i) => i === slug);
  if (exists) {
    const filtered = items.filter((i) => i !== slug);
    await writeJson("wishlist.json", filtered);
    return NextResponse.json({ success: true, removed: slug });
  }
  items.push(slug);
  await writeJson("wishlist.json", items);
  return NextResponse.json({ success: true, added: slug });
}

export async function GET() {
  const items = await readJson<any[]>("wishlist.json", []);
  return NextResponse.json({ success: true, items });
}
