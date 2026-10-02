"use client";

import { useWishlist } from "./WishlistProvider";

export default function AddToWishlistButton({ slug }: { slug: string }) {
  const { toggle, has } = useWishlist();
  const active = has(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      className={`mt-5 w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
        active ? 'bg-[color:var(--brand-deep-green)] text-[color:var(--brand-gold)]' : 'border border-slate-200 bg-white text-slate-700 hover:bg-[color:var(--brand-gold)]/15'
      }`}
    >
      {active ? 'Wishlisted' : 'Add to Wishlist'}
    </button>
  );
}
