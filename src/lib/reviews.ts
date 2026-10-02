export type StoredReview = {
  id: string;
  product?: string;
  rating: number;
  text: string;
  createdAt: string;
};

export function clampRating(rating: number) {
  return Math.max(0, Math.min(5, Math.round(rating)));
}

export function formatReviewDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
