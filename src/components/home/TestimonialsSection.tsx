"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReviewCard from "@/components/reviews/ReviewCard";
import type { StoredReview } from "@/lib/reviews";

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<StoredReview[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/reviews")
      .then((response) => response.json())
      .then((data) => { if (active) setReviews(Array.isArray(data.reviews) ? data.reviews : []); })
      .catch(() => { if (active) setReviews([]); });
    return () => { active = false; };
  }, []);

  if (reviews === null) return null;

  return (
    <section aria-labelledby="reviews-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Customer reviews</p>
          <h2 id="reviews-heading" className="section-heading mt-2">What customers say</h2>
          <p className="mt-3 text-sm text-slate-600">Reviews are shown exactly as submitted.</p>
        </div>
        <Link href="/reviews" className="text-sm font-semibold text-[color:var(--brand-deep-green)] underline-offset-4 hover:underline">Read all or write a review →</Link>
      </div>
      {reviews.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[color:var(--brand-gold)]/60 bg-[color:var(--brand-cream)] p-7 text-sm text-slate-700">
          No reviews yet. Bought something? <Link href="/reviews" className="font-semibold underline">Be the first to write one.</Link>
        </div>
      )}
    </section>
  );
}
