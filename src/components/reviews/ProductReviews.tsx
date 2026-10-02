"use client";

import { useEffect, useState } from "react";
import ReviewCard from "@/components/reviews/ReviewCard";
import { clampRating, type StoredReview } from "@/lib/reviews";

export default function ProductReviews({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<StoredReview[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/reviews")
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        const all: StoredReview[] = Array.isArray(data.reviews) ? data.reviews : [];
        setReviews(all.filter((review) => review.product === slug));
      })
      .catch(() => { if (active) setReviews([]); });
    return () => { active = false; };
  }, [slug]);

  if (reviews === null) {
    return null;
  }

  const count = reviews.length;
  const average = count ? reviews.reduce((sum, review) => sum + clampRating(review.rating), 0) / count : 0;

  return (
    <section className="rounded-[1.2rem] border border-slate-200 bg-white p-4" aria-label="Product reviews">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Customer reviews</h2>
        {count > 0 && (
          <span className="rounded-full bg-[color:var(--brand-gold)]/20 px-3 py-1 text-sm font-semibold text-[color:var(--brand-deep-green)]">
            {average.toFixed(1)} ★ · {count} review{count === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {count > 0 ? (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => <ReviewCard key={review.id} review={review} compact={false} />)}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          No customer reviews yet for this product. Be the first to share your experience.
        </p>
      )}
      <a href="/reviews" className="mt-4 inline-block text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">
        Write a review
      </a>
    </section>
  );
}
