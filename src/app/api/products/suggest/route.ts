import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog";
import { matchCategories, normalizeText, sanitizeQuery, searchCatalog } from "@/lib/productSearch";

const MIN_LENGTH = 2;
const LIMIT = 6;

// Lightweight autocomplete: a few products (image slug, name, price, stock) plus matching categories.
export async function GET(req: Request) {
  const q = sanitizeQuery(new URL(req.url).searchParams.get("q"));
  if (q.length < MIN_LENGTH || normalizeText(q).length < MIN_LENGTH) return NextResponse.json({ success: true, query: q, products: [], categories: [] });
  try {
    const catalog = await loadCatalog();
    const result = searchCatalog(catalog, { q, pageSize: LIMIT });
    return NextResponse.json(
      {
        success: true,
        query: q,
        correctedFrom: result.correctedFrom,
        total: result.total,
        products: result.items.map(({ slug, title, price, category, inStock }) => ({ slug, title, price, category, inStock })),
        categories: matchCategories(catalog, q).slice(0, 2),
      },
      { headers: { "Cache-Control": "private, max-age=10" } },
    );
  } catch {
    return NextResponse.json({ success: false, error: "Suggestions are temporarily unavailable" }, { status: 500 });
  }
}
