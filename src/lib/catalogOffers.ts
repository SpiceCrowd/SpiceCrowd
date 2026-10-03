import { loadPromotions } from "@/lib/pricingService";
import { isAdvertisable } from "@/lib/promotions";
import type { SearchableProduct } from "@/lib/productSearch";

// Products covered by a live, public offer that is limited to specific products or categories.
// Store-wide offers apply to every product, so they are not a useful filter and return null.
export async function getOfferSlugs(catalog: SearchableProduct[]): Promise<Set<string> | null> {
  try {
    const scoped = (await loadPromotions()).filter((promo) => {
      const scope = promo.appliesTo;
      return promo.kind === "discount" && isAdvertisable(promo) && Boolean(scope?.products?.length || scope?.categories?.length);
    });
    if (!scoped.length) return null;
    const slugs = new Set<string>();
    for (const product of catalog) {
      if (scoped.some((promo) => promo.appliesTo?.products?.includes(product.slug) || (product.category && promo.appliesTo?.categories?.includes(product.category)))) slugs.add(product.slug);
    }
    return slugs.size ? slugs : null;
  } catch {
    return null;
  }
}
