import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog";
import { getOfferSlugs } from "@/lib/catalogOffers";
import { parseSearchParams, searchCatalog } from "@/lib/productSearch";

// Paginated search over the live catalogue.
// Query: q, category/origin/heat (repeatable), minPrice, maxPrice, inStock=1, offer=1, sort, page, pageSize.
export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const catalog = await loadCatalog();
    const parsed = parseSearchParams((key) => params.get(key), (key) => params.getAll(key));
    const result = searchCatalog(catalog, { ...parsed, offerSlugs: await getOfferSlugs(catalog) });
    return NextResponse.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Search is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
