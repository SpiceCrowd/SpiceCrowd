import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog";
import { parseSearchParams, searchCatalog } from "@/lib/productSearch";

// Paginated search over the live catalogue. Query: q, category, origin, sort, inStock=1, maxPrice, page, pageSize.
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const result = searchCatalog(await loadCatalog(), parseSearchParams((key) => params.get(key)));
    return NextResponse.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Search is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
