import { clampRating, formatReviewDate, type StoredReview } from "@/lib/reviews";

export default function ReviewCard({ review, compact = false }: { review: StoredReview; compact?: boolean }) {
  const stars = clampRating(review.rating);
  return (
    <article className={`surface-lift shrink-0 rounded-2xl border border-[color:var(--brand-line)] bg-white shadow-sm ${compact ? "w-72 p-5" : "w-full p-6"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[color:var(--brand-gold)]" aria-label={`${stars} out of 5 stars`}>
          {"★".repeat(stars)}
          <span className="text-slate-200">{"★".repeat(5 - stars)}</span>
        </span>
        {review.createdAt && <span className="text-xs text-slate-400">{formatReviewDate(review.createdAt)}</span>}
      </div>
      <p className={`mt-4 leading-7 text-slate-700 ${compact ? "text-sm" : "text-base"}`}>&ldquo;{review.text}&rdquo;</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{review.product ? review.product.replace(/-/g, " ") : "Spice Crowd customer"}</p>
    </article>
  );
}
