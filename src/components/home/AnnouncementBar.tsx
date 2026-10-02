"use client";

import { useEffect, useState } from "react";

const announcements = [
  "Shop above ₹1,000 and explore 30% OFF eligibility at checkout.",
  "Shop above ₹10,000 and explore 40% OFF eligibility at checkout.",
  "Explore 20% OFF eligibility on selected combo packs.",
  "Explore 40% OFF eligibility on selected yearly packs.",
];

export default function AnnouncementBar() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % announcements.length), 5000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="border-b border-[color:var(--brand-gold)]/25 bg-[color:var(--brand-deep-green)] text-center text-xs font-semibold text-[color:var(--brand-gold)]" aria-live="polite">
    <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-center px-4 py-2 sm:px-6 lg:px-8">
      <span key={active} className="reveal">{announcements[active]}</span>
    </div>
  </div>;
}
