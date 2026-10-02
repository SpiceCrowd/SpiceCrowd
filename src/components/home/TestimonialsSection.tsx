"use client";

import { useEffect, useState } from "react";
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
    <section className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Customer testimonials">
      <div className="text-center">
        <p className="eyebrow">In their words</p>
        <h2 className="section-heading mt-3">Trusted by home cooks across India</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Every quote below comes directly from Spice Crowd&apos;s customer review system &mdash; nothing here is scripted.
        </p>
      </div>
      {reviews.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed border-[color:var(--brand-gold)]/60 bg-[color:var(--brand-cream)] p-7 text-center text-sm text-slate-700">
          No customer testimonials have been submitted yet. Genuine feedback will appear here as soon as customers share it.
        </div>
      )}
    </section>
  );
}
