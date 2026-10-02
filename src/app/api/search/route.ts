import { NextResponse } from "next/server";
import { getProducts, type Product } from "@/lib/products";
import { readJson } from "@/lib/storage";

type SearchableProduct = Product & {
  id?: string;
};

async function getProductsList(): Promise<SearchableProduct[]> {
  // prefer persisted products if present
  try {
    const persisted = await readJson<SearchableProduct[]>("products.json", []);
    if (persisted && persisted.length) return persisted;
  } catch {}
  return getProducts();
}

function scoreProduct(p: SearchableProduct, q: string) {
  if (!q) return 1;
  const title = (p.title || "").toLowerCase();
  const desc = (p.description || "").toLowerCase();
  const tag = (p.tag || "").toLowerCase();
  let score = 0;
  if (title.includes(q)) score += 5;
  if (tag.includes(q)) score += 3;
  if (desc.includes(q)) score += 1;
  // bonus for prefix match
  if (title.startsWith(q)) score += 2;
  return score;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const limit = Number(url.searchParams.get("limit") || 20);
  const products = await getProductsList();
  const scored = products.map((p) => ({ p, score: scoreProduct(p, q) })).filter((result) => result.score > 0 || !q);
  const results = scored.sort((a, b) => b.score - a.score).slice(0, limit).map((r) => r.p);
  return NextResponse.json({ success: true, q, results });
}
