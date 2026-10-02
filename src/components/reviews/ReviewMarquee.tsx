"use client";

import { useEffect, useRef, useState } from "react";
import ReviewCard from "@/components/reviews/ReviewCard";
import type { StoredReview } from "@/lib/reviews";

function useReviews() {
  const [reviews, setReviews] = useState<StoredReview[] | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/reviews")
      .then((response) => response.json())
      .then((data) => { if (active) setReviews(Array.isArray(data.reviews) ? data.reviews : []); })
      .catch(() => { if (active) setReviews([]); });
    return () => { active = false; };
  }, []);
  return reviews;
}

function MarqueeRow({ reviews, direction }: { reviews: StoredReview[]; direction: "left" | "right" }) {
  // Reviews are duplicated once so the animation can loop seamlessly; no content is fabricated.
  return (
    <div className="marquee-viewport overflow-hidden">
      <div className={`marquee-track flex gap-4 py-1 ${direction === "left" ? "marquee-track-left" : "marquee-track-right"}`}>
        <div className="flex shrink-0 gap-4" aria-hidden={false}>
          {reviews.map((review) => <ReviewCard key={review.id} review={review} compact />)}
        </div>
        <div className="flex shrink-0 gap-4" aria-hidden="true">
          {reviews.map((review) => <ReviewCard key={`${review.id}-loop`} review={review} compact />)}
        </div>
      </div>
    </div>
  );
}

export default function ReviewMarquee() {
  const reviews = useReviews();
  const containerRef = useRef<HTMLDivElement>(null);

  if (reviews === null) return null;
  if (reviews.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Customer reviews">
        <div className="rounded-2xl border border-dashed border-[color:var(--brand-gold)]/60 bg-[color:var(--brand-cream)] p-6 text-center text-sm text-slate-700">
          Be the first to share your Spice Crowd experience. No customer reviews have been submitted yet.
        </div>
      </section>
    );
  }

  const rowA = reviews;
  const rowB = [...reviews].reverse();

  return (
    <section
      ref={containerRef}
      className="mx-auto max-w-[100rem] space-y-4 px-0"
      aria-label="Customer reviews"
      onMouseEnter={() => containerRef.current?.classList.add("marquee-paused")}
      onMouseLeave={() => containerRef.current?.classList.remove("marquee-paused")}
      onFocus={() => containerRef.current?.classList.add("marquee-paused")}
      onBlur={() => containerRef.current?.classList.remove("marquee-paused")}
    >
      <MarqueeRow reviews={rowA} direction="left" />
      <MarqueeRow reviews={rowB} direction="right" />
    </section>
  );
}
