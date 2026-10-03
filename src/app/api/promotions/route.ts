import { NextResponse } from "next/server";
import { loadPromotions } from "@/lib/pricingService";
import { isAdvertisable, summarizePromotion } from "@/lib/promotions";

export async function GET() {
  const promotions = (await loadPromotions()).filter((promo) => isAdvertisable(promo));
  return NextResponse.json(
    { success: true, promotions: promotions.map(summarizePromotion) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
