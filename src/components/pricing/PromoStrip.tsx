"use client";

import { usePromotions } from "@/components/pricing/useQuote";
import type { Promotion } from "@/lib/promotions";

// Renders only offers that are live right now, using the server-generated eligibility text.
export default function PromoStrip({ kind, className = "" }: { kind?: Promotion["kind"]; className?: string }) {
  const { promotions } = usePromotions();
  const shown = promotions.filter((promo) => !kind || promo.kind === kind);
  if (!shown.length) return null;
  return (
    <ul className={`space-y-1 ${className}`}>
      {shown.map((promo) => (
        <li key={promo.id} title={promo.conditions.join(" | ")} className="text-sm text-[color:var(--brand-deep-green)]">
          {promo.headline}
          {promo.code ? ` (code ${promo.code})` : ""}
        </li>
      ))}
    </ul>
  );
}
