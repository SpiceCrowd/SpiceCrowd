"use client";

import { useEffect, useState } from "react";
import { usePromotions } from "@/components/pricing/useQuote";
import { promotionBannerText } from "@/components/pricing/promoText";

const brandMessage = "Freshly packed spices from Kolli Hills, delivered across India.";

export default function AnnouncementBar() {
  const { promotions } = usePromotions();
  const announcements = promotions.length ? promotions.map(promotionBannerText) : [brandMessage];
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (announcements.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % announcements.length), 5000);
    return () => window.clearInterval(timer);
  }, [announcements.length]);
  return <div className="border-b border-[color:var(--brand-gold)]/25 bg-[color:var(--brand-deep-green)] text-center text-xs font-semibold text-[color:var(--brand-gold)]" aria-live="polite">
    <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-center px-4 py-2 sm:px-6 lg:px-8">
      <span key={active} className="reveal">{announcements[active % announcements.length]}</span>
    </div>
  </div>;
}
