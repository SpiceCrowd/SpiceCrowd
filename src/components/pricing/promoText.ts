import type { PromotionSummary } from "@/lib/promotions";

export function promotionBannerText(promo: PromotionSummary) {
  const lead = promo.title === promo.headline ? promo.headline : `${promo.title}: ${promo.headline}`;
  return promo.code ? `${lead}. Use code ${promo.code}` : lead;
}
