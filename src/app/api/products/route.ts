import { NextResponse } from "next/server";
import { getProduct as fallbackProduct, matchesProductQuery, type Product } from "@/lib/products";
import { loadCatalog } from "@/lib/catalog";

// Full product records. Use /api/products/search for paginated search and /api/products/suggest for autocomplete.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const list = await loadCatalog();
    if (slug) {
      return NextResponse.json({ success: true, product: list.find((product) => product.slug === slug) || fallbackProduct(slug) });
    }

    const query = {
      category: url.searchParams.get("category"),
      origin: url.searchParams.get("origin"),
      q: url.searchParams.get("q"),
      variant: url.searchParams.get("variant"),
    };
    return NextResponse.json({ success: true, products: list.filter((product) => matchesProductQuery(product as Product, query)) });
  } catch {
    return NextResponse.json({ success: false, error: "The catalogue is temporarily unavailable" }, { status: 500 });
  }
}
