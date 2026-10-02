"use client";

import { useEffect, useRef, useState } from "react";
import ReviewCard from "@/components/reviews/ReviewCard";
import type { StoredReview } from "@/lib/reviews";

export default function ReviewStrip() {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/reviews").then((response) => response.json()).then((data) => setReviews(Array.isArray(data.reviews) ? data.reviews : [])).catch(() => setReviews([]));
  }, []);

  const scrollByCard = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  return (
    <section className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Featured customer reviews">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Customer notes</p>
          <h2 className="section-heading mt-3">Real words from the Spice Crowd</h2>
        </div>
        <div className="flex items-center gap-2">
          <a href="/reviews" className="text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">Read and write reviews</a>
          {reviews.length > 0 && (
            <div className="ml-2 hidden gap-2 sm:flex">
              <button type="button" aria-label="Scroll reviews left" onClick={() => scrollByCard(-1)} className="h-9 w-9 rounded-full border border-[color:var(--brand-line)] text-lg transition hover:border-[color:var(--brand-gold)]">‹</button>
              <button type="button" aria-label="Scroll reviews right" onClick={() => scrollByCard(1)} className="h-9 w-9 rounded-full border border-[color:var(--brand-line)] text-lg transition hover:border-[color:var(--brand-gold)]">›</button>
            </div>
          )}
        </div>
      </div>
      {reviews.length ? (
        <div ref={trackRef} className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
          {reviews.map((review) => <div key={review.id} className="snap-start"><ReviewCard review={review} compact /></div>)}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[color:var(--brand-gold)]/60 bg-[color:var(--brand-cream)] p-7 text-sm text-slate-700">Be the first to share your Spice Crowd experience. Reviews shown here come from the existing review system; no sample testimonials are displayed.</div>
      )}
    </section>
  );
}

